import {currencyFormatter, formatRequestPrice} from "./src/Utils";
import Request from "./src/Request";
import {fsyncSync} from "fs";
var phpUnserialize = require('phpunserialize');
const express = require("express");
const app = require("express")();
const fs = require('fs');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
const csrf = require('csurf')
const port = 9001;


const path = require('path');
// setup route middlewares
const csrfProtection = csrf({ cookie: true })
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/css', express.static('public/css'));
app.use('/js', express.static('public/js'));
app.use('/img', express.static('public/img'));
app.use(cookieParser())
// error handler
app.use(function (err, req, res, next) {
    if (err.code !== 'EBADCSRFTOKEN') return next(err)

    // handle CSRF token errors here
    res.status(403)
    res.send('form tampered with')
})

app.set('views', './views');
app.set('view engine', 'ejs');

let token;

app.get("/api/payments/init", csrfProtection, (req, res) => {

    // amount should be >= 0,01€
    // 1 € = 100
    if(!req.query.amount || req.query.amount < 1) {
        /*res.writeHead(301, {
            'Content-Type': 'text/html',
            Location: "http://localhost:9002/v1/web/api/payments/response"
        });*/
        //return res.end("404 Not Found");
    }

    let amount = currencyFormatter(req.query.amount);
    console.log("/api/payments/init");

    let request = new Request({
        consumer_key: "",
        api_key: "",
        secret_key: ""
    }, "test");

    request.getToken({
        merchant_id: '__CONSUMER_KEY',
        amount: 100,
        ref: 'sumref',
        custom_fields: 'foo=bar;bar=foo'
    }).then(data => {
        token = data;
        res.render('index', {token: token, amount: amount});
    }).catch((e) => {
        console.log("error...")
        //console.log(e.data)
        res.render('index', {token: token, amount: amount});
    });
    /*
    request.getPaymentStatus("trx-5fcbefbca1233-1607200700").then(data => {
        token = data;
        console.log(data);
        res.render('index', {token: token, amount: amount});
    }).catch((e) => {
        console.log("error...")
        console.log(e)
        res.render('index', {token: token, amount: amount});
    });

    request.getPaymentDetails("trx-5fcbefbca1233-1607200700").then(data => {
        token = data;
        console.log(data);
        res.render('index', {token: token, amount: amount});
    }).catch((e) => {
        console.log("error...")
        console.log(e)
        res.render('index', {token: token, amount: amount});
    });
    */
});

console.log("Run server on " + port);

app.listen(port);