import init, { Provider, Identity, Group, KeyPackage, RatchetTree } from '../pkg/openmls_wasm';

// 1. Initialize WASM once when app starts
await init();

// 2. Create Provider and Identity for current user
const provider = new Provider();
const identity = new Identity(provider, "id");

// 3. Generate KeyPackage and publish to server
const keyPackage = identity.key_package(provider);
const keyPackageBytes = keyPackage.to_bytes();
const keyPackageB64 = btoa(String.fromCharCode(...keyPackageBytes));

console.log(keyPackageB64);
// socket.emit('publish_key_package', { keyPackage: keyPackageB64 });