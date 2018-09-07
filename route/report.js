// jshint esversion : 6

var express = require('express');
var passport = require('passport');
var mongoose = require('mongoose');

var Transaction = require('../model/transaction');
var router = express.Router();

router.post('/generatereport',	
	passport.authenticate('jwt', {session: false}),
	(req, res) => {
		Transaction.getExpenseReportByMonth(req.body.groupId, req.body.year, (err, mmodel) => {
			if(err) res.status(501).json(err);
			else {
				Transaction.getExpenseReportByExpenseType(req.body.groupId, req.body.year, (err, cmodel) => {
					if(err) res.status(501).json(err);
					else {
						res.status(200).json({
							monthly: mmodel,
							catagorical: cmodel
						});						
					}
				});
			}
		});				
	}
);

router.post('/generateusergroupreport',	
	passport.authenticate('jwt', {session: false}),
	(req, res) => {
		Transaction.getUserGroupReportByMonth(req.body.groupId, req.body.year, req.body._Uid, (err, mmodel) => {
			if(err) res.status(501).json(err);
			else {
				Transaction.getUserGroupReportByCatagory(req.body.groupId, req.body.year, req.body._Uid, (err, cmodel) => {
					if(err) res.status(501).json(err);
					else {
						res.status(200).json({
							monthly: mmodel,
							catagorical: cmodel
						});						
					}
				});
			}
		});				
	}
);

router.post('/generateuserreport',	
	passport.authenticate('jwt', {session: false}),
	(req, res) => {
		Transaction.getUserReportByMonth(req.body.year, req.body._Uid, (err, mmodel) => {
			if(err) res.status(501).json(err);
			else {
				Transaction.getUserReportByCatagory(req.body.year, req.body._Uid, (err, cmodel) => {
					if(err) res.status(501).json(err);
					else {
						res.status(200).json({
							monthly: mmodel,
							catagorical: cmodel
						});						
					}
				});
			}
		});				
	}
);
module.exports = router;