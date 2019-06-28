import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import {
    uglify
} from 'rollup-plugin-uglify';

var plugins = [
    nodeResolve({
        browser: true
    }),
    commonjs(),
    babel({
        exclude: 'node_modules/**'
    }),
    uglify()
];

export default [{
    input: 'src/standard-http-client.js',
    output: {
        file: 'dist/standard-http-client.js',
        format: 'umd',
        name: 'StandardHttpClient'
    },
    plugins: plugins
}];