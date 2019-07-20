import {
    spawn
} from 'child_process';

import 'babel-polyfill';

import StandardHttpClient from '../src/standard-http-client.js';

var mockServer;
beforeAll(function() {
    return new Promise(function(resolve, reject) {
        mockServer = spawn('node', ['test/mock-server.js', 8001]);
        mockServer.stdout.on('data', (data) => {
            console.log(`mockServer stdout: ${data}`);
            resolve();
        });
        mockServer.stderr.on('data', (data) => {
            console.log(`mockServer stderr: ${data}`);
            reject();
        });
    });
});
afterAll(function() {
    mockServer.kill();
});

describe('继承', function() {
    test('beforeSend', async () => {
        class Shc extends StandardHttpClient {
            beforeSend(config) {
                config.baseURL = 'http://localhost:8001';
            }
        }

        var shc = new Shc();
        var [data, response] = await shc.send({
            url: '/api'
        });
        expect(data).toBe('data');
        expect(response.config.baseURL).toBe('http://localhost:8001');
    });

    test('afterSend-response', async () => {
        class Shc extends StandardHttpClient {
            afterSend(responseOrError) {
                if (!(responseOrError instanceof Error)) {
                    var response = responseOrError;
                    response.data.data = 'data1';
                }
            }
        }

        var shc = new Shc();
        var [data] = await shc.send({
            url: 'http://localhost:8001/api'
        });
        expect(data).toBe('data1');
    });
    test('afterSend-error', async () => {
        class Shc extends StandardHttpClient {
            afterSend(responseOrError) {
                if (responseOrError instanceof Error) {
                    var error = responseOrError;
                    error._extDesc = '网络请求404了';
                }
            }
        }

        var shc = new Shc();
        expect.assertions(8);
        try {
            await shc.send({
                url: 'http://localhost:8001/api-404'
            });
        } catch (error) {
            expect(error._extDesc).toBe('网络请求404了');

            expect(error.response).not.toBeNull();
            expect(error.request).not.toBeNull();
            expect(error.config).not.toBeNull();

            expect(error._desc).toBe('网络请求错误');
            expect(error._errorType).toBe('H');
            expect(error._errorNumber).toBe(404);
            expect(error._errorCode).toBe('H404');
        }
    });

    test('handleError', async () => {
        class Shc extends StandardHttpClient {
            handleError(error) {
                error._extDesc = '出错了吧';
            }
        }

        var shc = new Shc();
        expect.assertions(8);
        try {
            await shc.send({
                url: 'http://localhost:8001/api-404'
            });
        } catch (error) {
            expect(error._extDesc).toBe('出错了吧');

            expect(error.response).not.toBeNull();
            expect(error.request).not.toBeNull();
            expect(error.config).not.toBeNull();

            expect(error._desc).toBe('网络请求错误');
            expect(error._errorType).toBe('H');
            expect(error._errorNumber).toBe(404);
            expect(error._errorCode).toBe('H404');
        }
    });
    test('handleError-自己出错了', async () => {
        class Shc extends StandardHttpClient {
            handleError(error) {
                console.log(a.b);
            }
        }

        var shc = new Shc();
        expect.assertions(4);
        try {
            await shc.send({
                url: 'http://localhost:8001/api-404'
            });
        } catch (error) {
            expect(error._desc).toBe('客户端处理出错');
            expect(error._errorType).toBe('C');
            expect(error._errorNumber).not.toBeNull();
            expect(error._errorCode.charAt(0)).toBe('C');
        }
    });
});