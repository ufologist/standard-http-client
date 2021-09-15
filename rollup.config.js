import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import {
    uglify
} from 'rollup-plugin-uglify';

var input = 'src/standard-http-client.ts';

export default [{
    input: input,
    output: {
        file: 'dist/standard-http-client.js',
        format: 'umd',
        name: 'StandardHttpClient'
    },
    plugins: [
        nodeResolve({
            browser: true
        }),
        commonjs(),
        typescript(),
        uglify()
    ]
}, {
    input: input,
    output: {
        file: 'dist/standard-http-client.common.js',
        format: 'cjs'
    },
    plugins: [
        commonjs(),
        typescript(),
    ]
}, {
    input: input,
    output: {
        file: 'dist/standard-http-client.esm.js',
        format: 'esm'
    },
    plugins: [
        commonjs(),
        typescript(),
    ]
}];