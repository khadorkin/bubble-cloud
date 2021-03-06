var chai = require('chai');
var request = require('supertest');
var app = require('../../app.js');
var User = require('../Web/Controllers/User');
var StringUtil = require('../Utilities/StringUtil');
var expect = chai.expect;
describe('API Unit Tests:', function () {
    var agent = request.agent(app);
    var csrfToken;
    it('should create a new user', function (done) {
        var user = new User({
            email: 'test@gmail.com',
            password: 'password'
        });
        user.save(function (err) {
            if (err)
                return done(err);
            done();
        });
    });
    it('should login user', function (done) {
        agent
            .get('/login')
            .expect(200)
            .end(function (err, res) {
            if (err) {
                return done(err);
            }
            csrfToken = StringUtil.parseBetween("name=\"_csrf\" value=\"", "\"", res.res.text);
            agent
                .post('/login')
                .set("x-csrf-token", csrfToken)
                .field('email', 'test@gmail.com')
                .field('password', 'password')
                .expect(302)
                .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                done();
            });
        });
    });
    it('should return 404', function (done) {
        agent
            .post('/rpc')
            .set("x-csrf-token", csrfToken)
            .send({ "jsonrpc": "2.0", "method": "subtract", "params": [42, 23], "id": 1 })
            .expect(200)
            .end(function (err, res) {
            if (err) {
                return done(err);
            }
            console.log(res.text);
            var rpcResponse = JSON.parse(res.text);
            expect(rpcResponse.result).to.equal(19);
            done();
        });
    });
    it('should delete a user', function (done) {
        User.remove({ email: 'test@gmail.com' }, function (err) {
            if (err)
                return done(err);
            done();
        });
    });
});
