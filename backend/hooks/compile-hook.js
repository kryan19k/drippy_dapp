#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function compileHook(sourceFile, outputFile) {
    console.log(`Compiling ${sourceFile} to ${outputFile}...`);

    // Read the source file
    const source = fs.readFileSync(sourceFile, 'utf8');

    // Prepare the API request
    const requestBody = {
        output: "wasm",
        files: [
            {
                name: path.basename(sourceFile),
                content: source
            }
        ]
    };

    try {
        const response = await fetch('http://localhost:9000/api/build', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.arrayBuffer();

        // Ensure output directory exists
        const outputDir = path.dirname(outputFile);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Write WASM file
        fs.writeFileSync(outputFile, Buffer.from(result));

        // Create hex file
        const hexFile = outputFile + '.hex';
        const hexContent = Buffer.from(result).toString('hex').toUpperCase();
        fs.writeFileSync(hexFile, hexContent);

        console.log(`✅ Compiled successfully:`);
        console.log(`   WASM: ${outputFile}`);
        console.log(`   HEX:  ${hexFile}`);
        console.log(`   Size: ${result.byteLength} bytes`);

        return true;
    } catch (error) {
        console.error(`❌ Compilation failed for ${sourceFile}:`, error.message);
        return false;
    }
}

async function main() {
    const hooks = [
        {
            source: 'src/drippy_enhanced_claim.c',
            output: 'build/drippy_enhanced_claim.wasm'
        },
        {
            source: 'src/drippy_fee_router.c',
            output: 'build/drippy_fee_router.wasm'
        },
        {
            source: 'src/drippy_claim_hook.c',
            output: 'build/drippy_claim_hook.wasm'
        }
    ];

    let allSuccess = true;

    for (const hook of hooks) {
        const success = await compileHook(hook.source, hook.output);
        if (!success) {
            allSuccess = false;
        }
    }

    if (allSuccess) {
        console.log('\n🎉 All hooks compiled successfully!');
    } else {
        console.log('\n❌ Some hooks failed to compile');
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}