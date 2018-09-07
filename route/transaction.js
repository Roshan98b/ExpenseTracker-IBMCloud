// jshint esversion : 6

var express = require('express');
var passport = require('passport');
var mongoose = require('mongoose');

var Member = require('../model/member');
var Transaction = require('../model/transaction');
var router = express.Router();

router.post('/bill',
	passport.authenticate('jwt', {session: false}),
	(req, res) => {
		var obj = req.body;
		obj._id = new mongoose.Types.ObjectId();
		obj.expenseDate = new Date(obj.expenseDate);
		var bill = new Transaction(obj);
		Transaction.add(bill, (err, model) => {
			if(err) res.status(501).json({message: 'Bill Uppload Unsuccessful'});
			else {
				res.status(200).json({message: 'Bill Upload Successful'});
			}
		});
	}
);

router.post('/initialtransaction',
	passport.authenticate('jwt', {session: false}),
	(req, res) => {
		var groupId = req.body.groupId;
		Transaction.getInitial(groupId, (err, model) => {
			if(err) res.status(501).json({message: 'Error Initial Transaction 1'});
			else res.status(200).json(model);
		});
	}
);

router.post('/approvedtransaction',
	passport.authenticate('jwt', {session: false}),
	(req, res) => {
		var groupId = req.body.groupId;
		Transaction.getApproved(groupId, (err, model) => {
			if(err) res.status(501).json({message: 'Error Initial Transaction'});
			else res.status(200).json(model);	
		});
	}
);

router.post('/unapprovedtransaction',
	passport.authenticate('jwt', {session: false}),
	(req, res) => {
		var groupId = req.body.groupId;
		Transaction.getUnapproved(groupId, (err, model) => {
			if(err) res.status(501).json({message: 'Error Initial Transaction'});
			else res.status(200).json(model);			
		});
	}
);

router.post('/completedtransaction',
	passport.authenticate('jwt', {session: false}),
	(req, res) => {
		var groupId = req.body.groupId;
		Transaction.getCompleted(groupId, (err, model) => {
			if(err) res.status(501).json({message: 'Error Initial Transaction'});
			else res.status(200).json(model);
		});
	}
);

router.post('/updatepoll',
	passport.authenticate('jwt', {session: false}),
	(req, res) => {
		var obj = req.body;
		Transaction.updatePoll(obj, (err, model) => {
			if(err) res.status(501).json(err);
			else res.status(200).json(model);
		});
	}
);

router.post('/checkcomplete',
	passport.authenticate('jwt', {session: false}),
	(req, res) => {
		Transaction.getApproved(req.body.groupId, (err, model) => {
			if(err) res.status(501).json(err);
			else {
				let flag;
				if(!model.length) res.status(200).json({message: 'Empty'});
				else {
					for(let i of model) {
						flag = true;
						for(let j of i.members) {
							if(j.amount != 0) {
								flag = false;
								break;
							}
						}
						if(flag) {
							Transaction.statusCompleted(i._id, (err, model) => {
								if(err) res.status(501).json(err);
							});
						}
					}
					res.status(200).json({message: "Success"});
				}
			}
		});
	}
);

router.post('/changestatus',
	passport.authenticate('jwt', {session: false}),
	(req, res) => {
		Transaction.getInitial(mongoose.Types.ObjectId(req.body.groupId), (err, model) =>{
			if(err) res.status(501).json(err);
			else {
				if(!model.length) res.status(200).json({message: 'Empty'});
				else {
					for(let i of model) {
						let diff = (new Date() - i.uploadDate)/1e3;
						if(diff > 84600) {
							let True = 0, False = 0;
							for(let j of i.poll) {
								if(j.response) True++;
								else False++;
							}
							for(let j of i.members) 
								if(j.amount == 0) False--;						 
							if(True >= False) {
								Transaction.statusApproved(i._id, (err, model) => {
									if(err) res.status(501).json(err);
								});
							}
							else {
								Transaction.statusUnapproved(i._id, (err, model) => {
									if(err) res.status(501).json(err);
								});
							}	
						}
					}
					res.status(200).json({message: 'Checked'});
				}	
			}
		});
	}
);

router.post('/updatetoinitial',
	passport.authenticate('jwt', {session: false}),
	(req, res) => {
		var obj = req.body;
		obj.expenseDate = new Date(obj.expenseDate);
		obj.uploadDate = new Date();
		obj.poll = [];
    for (let i of obj.members) {
      obj.poll.push({
        _id: i._id,
        response: false
      });
      delete i.email;
    }
		Transaction.updateToInitial(obj, (err, model) => {
			if(err) res.status(501).json(err);
			else res.status(200).json({message: "Update To Initial Successfull"});	
		});
	}
);

router.post('/billpayment',
	passport.authenticate('jwt', {session: false}),
	(req, res) => {
		let amt;
		let obj = {};
		obj._id = req.body._id;
		obj._Uid = req.body._Uid;
		obj._Did = req.body._Did;
		obj.memberBalance = req.body.memberBalance - req.body.transactionAmount;
		obj.destBalance = req.body.transactionAmount;
		obj.transactionAmount = 0;
		Transaction.makePayment(obj, (err, model) => {
			if(err) res.status(501).json(err);
			else {
				Member.makePayment(obj, (err, model) => {
					if(err) res.status(501).json(err);
					else {
						Member.updateBalance(obj, (err, model) => {
							if(err) res.status(501).json(err);
							else res.status(200).json(obj);
						});
					}	
				});
			}				
		});
	}
);

router.post('/deletetransaction',
	passport.authenticate('jwt', {session: false}),
	(req, res) => {
		var obj = req.body._id;
		Transaction.delete(obj, (err) => {
			if(err) res.status(501).json(err);
			else res.status(200).json({message: 'Delete Successful'});
		});
	}
);

module.exports = router;