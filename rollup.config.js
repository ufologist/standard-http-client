import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import {
    uglify
} from 'rollup-plugin-uglify';

var input = 'src/standard-http-client.js';
var babelPlugin = babel({
    exclude: 'node_modules/**'
});

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
        babelPlugin,
        uglify()
    ]
}, {
    input: input,
    output: {
        file: 'dist/standard-http-client.common.js',
        format: 'cjs'
    },
    plugins: [
        babelPlugin
    ]
}, {
    input: input,
    output: {
        file: 'dist/standard-http-client.esm.js',
        format: 'esm'
    },
    plugins: [
        babelPlugin
    ]
}];