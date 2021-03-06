const express = require("express");
const plaid = require("plaid");
const router = express.Router();
const passport = require("passport");
const moment = require("moment");
const mongoose = require("mongoose");

// Load Account and User models
const Account = require("../../models/Account");
const User = require("../../models/User");

// const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
// const PLAID_SECRET = process.env.PLAID_SECRET;
// const PLAID_PUBLIC_KEY = process.env.PLAID_PUBLIC_KEY;

const PLAID_CLIENT_ID = '5e5ee188d52ab60013b293ed';
const PLAID_SECRET = 'd60b369bb51a59d4cf081544825b14';
const PLAID_PUBLIC_KEY = '6071aee79b72c56fde5966240b05de';

const client = new plaid.Client(
  PLAID_CLIENT_ID,
  PLAID_SECRET,
  PLAID_PUBLIC_KEY,
  plaid.environments.development,
  { version: "2019-05-29" }
);

let PUBLIC_TOKEN = null;
let ACCESS_TOKEN = null;
let ITEM_ID = null;

// @route POST api/plaid/accounts/add
// @desc Trades public token for access token and stores credentials in database
// @access Private
router.post('/accounts/add', passport.authenticate('jwt', { session: false }), (req, res) => {
  PUBLIC_TOKEN = req.body.public_token;
  
  const userId = req.user.id;
  const institution = req.body.metadata.institution;
  const { name, institution_id } = institution;

  if (PUBLIC_TOKEN) {
    client
      .exchangePublicToken(PUBLIC_TOKEN)
      .then(exchangeResponse => {
        ACCESS_TOKEN = exchangeResponse.access_token;
        ITEM_ID = exchangeResponse.item_id;

        // Check if account already exists for user
        Account.findOne({
          userId: req.user.id,
          institutionId: institution_id
        })
        .then(account => {
          if (account) {
          } else {
            const newAccount = new Account({
              userId: userId,
              accessToken: ACCESS_TOKEN,
              itemId: ITEM_ID,
              institutionId: institution_id,
              institutionName: name
            });

            newAccount.save().then(account => res.json(account));
          }
        })
        .catch(err => console.log(err)) // Mongo error
      })
      .catch(err => console.log(err)); // Plaid error
  }
})

// @route GET api/plaid/accounts
// @desc Get all accounts linked with plaid for a specific user
// @access Private
router.get('/accounts', passport.authenticate('jwt', { session: false }), (req, res) => {
  Account.find({ userId: req.user.id })
    .then(accounts => res.json(accounts))
    .catch(err => console.log(err));
})

// @route DELETE api/plaid/accounts/:id
// @desc Delete account with given id
// @access Private
router.delete('/accounts/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Account.findById(req.params.id).then(account => {
    account.remove().then(() => res.json({ success: true }));
  })
})

// @route POST api/plaid/accounts/transactions
// @desc Fetch transactions from past 30 days from all linked accounts
// @access Private
router.post('/accounts/transactions', passport.authenticate('jwt', { session: false }), (req, res) => {
  const now = moment();
  const today = now.format('YYYY-MM-DD');
  const thirtyDaysAgo = now.subtract(30, 'days').format('YYYY-MM-DD');

  let transactions = [];

  const accounts = req.body;

  if (accounts) {
    accounts.forEach(function(account) {
      ACCESS_TOKEN = account.accessToken;
      const institutionName = account.institutionName;

      client.getTransactions(ACCESS_TOKEN, thirtyDaysAgo, today)
        .then(response => {
          // console.log('response', response.transactions)
          transactions.push({
            accountName: institutionName,
            transactions: response.transactions
          });

          if (transactions.length === accounts.length) {
            res.json(transactions);
          }
        })
        .catch(err => console.log(err));
    })
  }
})

module.exports = router;