import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

Object.defineProperty(globalThis, 'TextEncoder', {
	writable: true,
	value: TextEncoder,
});

Object.defineProperty(globalThis, 'TextDecoder', {
	writable: true,
	value: TextDecoder,
});
