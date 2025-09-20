ARG HOOKS_IMAGE=ghcr.io/xrplf/hooks-builder:latest
FROM ${HOOKS_IMAGE} as builder
WORKDIR /work
COPY . .
# Example build command; adapt to your builder layout
RUN make -C /opt/hooks build || true \
 && cc -I/opt/hooks/include -O3 -c src/drippy_claim_hook.c -o build/hook.o \
 && /opt/hooks/bin/hook-build build/hook.o -o build/drippy_claim_hook.wasm \
 && xxd -p build/drippy_claim_hook.wasm > build/drippy_claim_hook.wasm.hex

