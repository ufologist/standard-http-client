import {
    spawn
} from 'child_process';

import 'babel-polyfill';

import StandardHttpClient from '../src/standard-http-client.js';

var mockServer;
beforeAll(function() {
    return new Promise(function(resolve, reject) {
        mockServer = spawn('node', ['test/mock-server.js']);
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

// TODO JSONP 测试不了
describe('发送 HTTP 请求', function() {
    test('发送成功', async () => {
        var shc = new StandardHttpClient();
        var [data, response] = await shc.send({
            url: 'http://localhost:8000/api'
        });
        expect(response).not.toBeNull();
    });

    test('发送失败', async () => {
        var shc = new StandardHttpClient();
        expect.assertions(5);
        try {
            await shc.send({
                url: 'http://localhost:8000/api',
                timeout: 1
            });
        } catch (error) {
            expect(error.response).toBeUndefined();

            expect(error._desc).toBe('网络请求失败');
            expect(error._errorType).toBe('A');
            expect(error._errorNumber).not.toBeNull();
            expect(error._errorCode.charAt(0)).toBe('A');
        }
    });
});

describe('发送成功', function() {
    test('HTTP 成功', async () => {
        var shc = new StandardHttpClient();
        var [data, response] = await shc.send({
            url: 'http://localhost:8000/api'
        });
        expect(response.status).toBe(200);
    });

    test('HTTP 异常', async () => {
        var shc = new StandardHttpClient();
        expect.assertions(7);
        try {
            await shc.send({
                url: 'http://localhost:8000/api-404'
            });
        } catch (error) {
            expect(error.response).not.toBeNull();
            expect(error.request).not.toBeNull();
            expect(error.config).not.toBeNull();

            expect(error._desc).toBe('网络请求错误');
            expect(error._errorType).toBe('H');
            expect(error._errorNumber).toBe(404);
            expect(error._errorCode).toBe('H404');
        }
    });
});

describe('接口调用', function() {
    test('成功', async () => {
        var shc = new StandardHttpClient();
        var [data] = await shc.send({
            url: 'http://localhost:8000/api'
        });
        expect(data).toBe('data');
    });

    test('成功-带默认配置', async () => {
        var shc = new StandardHttpClient({
            baseURL: 'http://localhost:8000'
        });
        var [data] = await shc.send({
            url: '/api'
        });
        expect(data).toBe('data');
    });

    test('接口返回空数据', async () => {
        var shc = new StandardHttpClient();

        expect.assertions(8);
        try {
            await shc.send({
                url: 'http://localhost:8000/api-response-empty'
            });
        } catch (error) {
            expect(error.response).not.toBeNull();
            expect(error.request).not.toBeNull();
            expect(error.config).not.toBeNull();

            expect(error.message).toBe('接口调用出错但未提供错误信息');
            expect(error._desc).toBe('接口调用出错');
            expect(error._errorType).toBe('B');
            expect(error._errorNumber).toBe(0);
            expect(error._errorCode).toBe('B0');
        }
    });

    test('失败-没有提供错误信息', async () => {
        var shc = new StandardHttpClient();
        expect.assertions(8);
        try {
            await shc.send({
                url: 'http://localhost:8000/api',
                params: {
                    status: 1
                }
            });
        } catch (error) {
            expect(error.response).not.toBeNull();
            expect(error.request).not.toBeNull();
            expect(error.config).not.toBeNull();

            expect(error.message).toBe('接口调用出错但未提供错误信息');
            expect(error._desc).toBe('接口调用出错');
            expect(error._errorType).toBe('B');
            expect(error._errorNumber).toBe(1);
            expect(error._errorCode).toBe('B1');
        }
    });

    test('失败-提供了错误信息', async () => {
        var shc = new StandardHttpClient();
        expect.assertions(5);
        try {
            await shc.send({
                url: 'http://localhost:8000/api',
                params: {
                    status: 2,
                    message: '接口调用失败了'
                }
            });
        } catch (error) {
            expect(error.message).toBe('接口调用失败了');
            expect(error._desc).toBe('接口调用出错');
            expect(error._errorType).toBe('B');
            expect(error._errorNumber).toBe(2);
            expect(error._errorCode).toBe('B2');
        }
    });

    test('失败-提供了 message 信息', async () => {
        var shc = new StandardHttpClient();
        expect.assertions(5);
        try {
            await shc.send({
                url: 'http://localhost:8000/api',
                params: {
                    status: 2,
                    onlyMessage: '接口调用失败了'
                }
            });
        } catch (error) {
            expect(error.message).toBe('接口调用失败了');
            expect(error._desc).toBe('接口调用出错');
            expect(error._errorType).toBe('B');
            expect(error._errorNumber).toBe(2);
            expect(error._errorCode).toBe('B2');
        }
    });

    test('客户端处理出错', async () => {
        var shc = new StandardHttpClient();
        expect.assertions(4);
        try {
            await shc.send({
                url: 'http://localhost:8000/api',
                transformResponse: [function(data) {
                    console.log(a.b);
                    return data;
                }]
            });
        } catch (error) {
            expect(error._desc).toBe('客户端处理出错');
            expect(error._errorType).toBe('C');
            expect(error._errorNumber).not.toBeNull();
            expect(error._errorCode.charAt(0)).toBe('C');
        }
    });
});

describe('适配 _data 参数', function() {
    test('GET 请求', async () => {
        var shc = new StandardHttpClient();
        var [data, response] = await shc.send({
            url: 'http://localhost:8000/api',
            _data: {
                a: 1,
                b: 2
            }
        });

        expect(data).toBe('data');
        expect(response.config.params).toEqual({a: 1, b: 2});
    });

    test('GET 请求-优先 params 参数', async () => {
        var shc = new StandardHttpClient();
        var [data, response] = await shc.send({
            url: 'http://localhost:8000/api',
            params: {
                a: 11,
                b: 22
            },
            _data: {
                a: 1,
                b: 2
            }
        });

        expect(data).toBe('data');
        expect(response.config.params).toEqual({
            a: 11,
            b: 22
        });
    });

    test('POST 请求', async () => {
        var shc = new StandardHttpClient();
        var [data, response] = await shc.send({
            method: 'post',
            url: 'http://localhost:8000/api',
            _data: {
                a: 1,
                b: 2
            }
        });

        expect(data).toBe('data');
        expect(response.config.data).toBe('a=1&b=2');
    });

    test('POST 请求-不处理非 object 类型', async () => {
        var shc = new StandardHttpClient();
        var [data, response] = await shc.send({
            method: 'post',
            url: 'http://localhost:8000/api',
            _data: '{"a":1,"b":2}'
        });

        expect(data).toBe('data');
        expect(response.config.data).toBe('{"a":1,"b":2}');
    });

    test('POST 请求-优先 data 参数', async () => {
        var shc = new StandardHttpClient();
        var [data, response] = await shc.send({
            method: 'post',
            url: 'http://localhost:8000/api',
            data: {
                a: 11,
                b: 22
            },
            _data: {
                a: 1,
                b: 2
            }
        });

        expect(data).toBe('data');
        expect(response.config.data).toBe('{"a":11,"b":22}');
    });
});

describe('适配接口数据以符合接口规范', function() {
    // 注意这里的 data 是原始数据, 即大部分情况都是 string 类型
    // axios 默认的 transformResponse 是对 data 做了 JSON.parse
    function transformResponse(data) {
        var _data = JSON.parse(data);

        var standardData = {
            status: 0,
            data: null,
            statusInfo: {
                message: '',
                detail: ''
            }
        };

        standardData.status = _data.code;
        standardData.data = _data.res;
        standardData.statusInfo.message = _data.message;

        return standardData;
    }

    test('接口调用成功', async () => {
        var shc = new StandardHttpClient();

        // 针对单个差异化的接口做适配
        var [data] = await shc.send({
            url: 'http://localhost:8000/api-response-not-standard',
            transformResponse: [transformResponse]
        });

        expect(data).toBe('data');
    });

    test('接口调用失败', async () => {
        // 针对整个 client 的接口做适配
        var shc = new StandardHttpClient({
            transformResponse: [transformResponse]
        });

        expect.assertions(5);
        try {
            await shc.send({
                url: 'http://localhost:8000/api-response-not-standard',
                params: {
                    code: 2,
                    message: '接口调用失败了'
                }
            });
        } catch (error) {
            expect(error.message).toBe('接口调用失败了');
            expect(error._desc).toBe('接口调用出错');
            expect(error._errorType).toBe('B');
            expect(error._errorNumber).toBe(2);
            expect(error._errorCode).toBe('B2');
        }
    });
});

describe('继承', function() {
    test('beforeSend', async () => {
        class Shc extends StandardHttpClient {
            beforeSend(config) {
                config.baseURL = 'http://localhost:8000';
            }
        }

        var shc = new Shc();
        var [data, response] = await shc.send({
            url: '/api'
        });
        expect(data).toBe('data');
        expect(response.config.baseURL).toBe('http://localhost:8000');
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
            url: 'http://localhost:8000/api'
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
                url: 'http://localhost:8000/api-404'
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
                url: 'http://localhost:8000/api-404'
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
                url: 'http://localhost:8000/api-404'
            });
        } catch (error) {
            expect(error._desc).toBe('客户端处理出错');
            expect(error._errorType).toBe('C');
            expect(error._errorNumber).not.toBeNull();
            expect(error._errorCode.charAt(0)).toBe('C');
        }
    });
});