HOOKS_IMAGE ?= eqlabs/xrpl-hooks-compiler:dev

# Hook definitions
CLAIM_SRC := src/drippy_enhanced_claim.c
CLAIM_OUT := build/drippy_enhanced_claim.wasm
CLAIM_HEX := build/drippy_enhanced_claim.wasm.hex

ROUTER_SRC := src/drippy_fee_router.c
ROUTER_OUT := build/drippy_fee_router.wasm
ROUTER_HEX := build/drippy_fee_router.wasm.hex

# Legacy support
LEGACY_SRC := src/drippy_claim_hook.c
LEGACY_OUT := build/drippy_claim_hook.wasm
LEGACY_HEX := build/drippy_claim_hook.wasm.hex

.PHONY: build clean docker-build build-claim build-router build-legacy build-all

build:
	@echo "Available targets:"
	@echo "  make build-all     - Build all hooks"
	@echo "  make build-claim   - Build enhanced claim hook"
	@echo "  make build-router  - Build fee router hook"
	@echo "  make build-legacy  - Build legacy claim hook"

build-all: build-claim build-router build-legacy

build-claim:
	@echo "Building Enhanced Claim Hook..."
	@mkdir -p build
	@docker run --rm -v "$$(pwd):/work" -w /work $(HOOKS_IMAGE) \
		bash -lc "make -C /opt/hooks build && cc -I/opt/hooks/include -O3 -c $(CLAIM_SRC) -o build/claim_hook.o && /opt/hooks/bin/hook-build build/claim_hook.o -o $(CLAIM_OUT) && xxd -p $(CLAIM_OUT) > $(CLAIM_HEX)"
	@echo "Built: $(CLAIM_OUT) and $(CLAIM_HEX)"

build-router:
	@echo "Building Fee Router Hook..."
	@mkdir -p build
	@docker run --rm -v "$$(pwd):/work" -w /work $(HOOKS_IMAGE) \
		bash -lc "make -C /opt/hooks build && cc -I/opt/hooks/include -O3 -c $(ROUTER_SRC) -o build/router_hook.o && /opt/hooks/bin/hook-build build/router_hook.o -o $(ROUTER_OUT) && xxd -p $(ROUTER_OUT) > $(ROUTER_HEX)"
	@echo "Built: $(ROUTER_OUT) and $(ROUTER_HEX)"

build-legacy:
	@echo "Building Legacy Claim Hook..."
	@mkdir -p build
	@docker run --rm -v "$$(pwd):/work" -w /work $(HOOKS_IMAGE) \
		bash -lc "make -C /opt/hooks build && cc -I/opt/hooks/include -O3 -c $(LEGACY_SRC) -o build/legacy_hook.o && /opt/hooks/bin/hook-build build/legacy_hook.o -o $(LEGACY_OUT) && xxd -p $(LEGACY_OUT) > $(LEGACY_HEX)"
	@echo "Built: $(LEGACY_OUT) and $(LEGACY_HEX)"

# Docker build alias for backwards compatibility
docker-build: build-claim

# Verify hook builds
verify:
	@echo "Verifying hook builds..."
	@ls -la build/*.wasm build/*.hex 2>/dev/null || echo "No hooks built yet"

clean:
	rm -rf build

# Help target
help:
	@echo "DRIPPY Hooks Build System"
	@echo ""
	@echo "Targets:"
	@echo "  build-all     Build all hooks (claim, router, legacy)"
	@echo "  build-claim   Build enhanced claim hook"
	@echo "  build-router  Build fee router hook"
	@echo "  build-legacy  Build legacy claim hook"
	@echo "  verify        Check built hooks"
	@echo "  clean         Remove build artifacts"
	@echo ""
	@echo "Environment:"
	@echo "  HOOKS_IMAGE=$(HOOKS_IMAGE)"

