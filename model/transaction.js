// jshint esversion : 6

var mongoose = require('mongoose');

var ModelSchema = mongoose.Schema({
	_id: {
		type: mongoose.Schema.ObjectId
	},
	_Uid: {
		type: mongoose.Schema.ObjectId,
		refs: 'member',
		unique: false
	},
	_groupId: {
		type: mongoose.Schema.ObjectId,
		refs: 'group',
		unique: false
	},	
	transactionName: {
		type: String,
		required: true
	},
	amount: {
		type: Number,
		required: true
	},
	expenseDate: {
		type: Date,
		required: true
	},
	uploadDate: {
		type: Date,
		default: Date.now
	},
	expenseType: {
		type: String
	},
	comments : {
		type: String
	},
	members: [{
		_id: {
			type: mongoose.Schema.ObjectId,
			refs: 'member'
		},
		amount: {
			type: Number 
		}
	}],
	initial: [{
		_id: {
			type: mongoose.Schema.ObjectId,
			refs: 'member'
		},
		amount: {
			type: Number 
		}
	}],	
	poll: [{
		_id: {
			type: mongoose.Schema.ObjectId,
			refs: 'member'
		},
		response: {
			type: Boolean
		}
	}],
	status: {
		type: Number
	}
});

var Transaction = mongoose.model('transaction', ModelSchema);

module.exports = Transaction;

module.exports.add = (model, callback) => {
	model.save(callback);
};

module.exports.getInitial = (groupId, callback) => {
	var query = {'_groupId': groupId, status: 0};
	Transaction.find(query, callback);
};

module.exports.getApproved = (groupId, callback) => {
	var query = {'_groupId': groupId, status: 1};
	Transaction.find(query, callback);
};

module.exports.getUnapproved = (groupId, callback) => {
	var query = {'_groupId': groupId, status: 2};
	Transaction.find(query, callback);
};

module.exports.getCompleted = (groupId, callback) => {
	var query = {'_groupId': groupId, status: 3};
	Transaction.find(query, callback);
};

module.exports.updatePoll = (obj, callback) => {
	match = {_id: mongoose.Types.ObjectId(obj._id), 'poll._id': mongoose.Types.ObjectId(obj.poll._id)};
	set = {$set: {'poll.$.response': obj.poll.response}};
	Transaction.update(match, set, callback);
};

module.exports.statusApproved = (id, callback) => {
	var query = {'_id': mongoose.Types.ObjectId(id), status: 0};
	var update = {$set: {status: 1}};
	Transaction.update(query, update, callback);	
};

module.exports.statusUnapproved = (id, callback) => {
	var query = {'_id': mongoose.Types.ObjectId(id), status: 0};
	var update = {$set: {status: 2}};
	Transaction.update(query, update, callback);	
};

module.exports.statusCompleted = (id, callback) => {
	var query = {'_id': mongoose.Types.ObjectId(id), status: 1};
	var update = {$set: {status: 3}};
	Transaction.update(query, update, callback);	
};

module.exports.updateToInitial = (obj, callback) => {
	var query = {'_id': mongoose.Types.ObjectId(obj._id)};
	var update = {$set: 
		{
			transactionName: obj.transactionName,
			amount: obj.amount,
			expenseDate: obj.expenseDate,
			expenseType: obj.expenseType,
			comments: obj.comments,
			members: obj.members,
			initial: obj.initial,
			poll: obj.poll,
			status: 0,
			uploadDate: obj.uploadDate,
		}
	};
	Transaction.update(query, update, callback);
};

module.exports.makePayment = (obj, callback) => {
	var query = {_id: mongoose.Types.ObjectId(obj._id), 'members._id': mongoose.Types.ObjectId(obj._Uid)};
	var update = {$set: {'members.$.amount': obj.transactionAmount}};
	Transaction.update(query, update, callback);
};

module.exports.delete = (_id, callback) => {
	var query = {_id: mongoose.Types.ObjectId(_id)};
	Transaction.remove(query, callback);
};


// Monthly Report
module.exports.getExpenseReportByMonth = (groupId, year, callback) => {
	var match = {
		$match: {
			status: 3, 
			_groupId: mongoose.Types.ObjectId(groupId), 
			expenseDate: {
				$gte: new Date(year+"-01-01T00:00:00.0Z"), 
				$lte: new Date(year+"-12-31T00:00:00.0Z")
			}
		}
	};	
	var sort = {
		$sort: {
			month: 1
		}
	};
	var group = {
		$group: {
			_id: {month: {$month: '$expenseDate'}, year: {$year: '$expenseDate'}},
			expense: {$sum: '$amount'}
		}
	};
	var project = {
		$project: {
			_id: 0,
			month: "$_id.month",
			expense: 1	
		}
	};
	Transaction.aggregate([match, group, project, sort], callback);
};

// Expense Type Report
module.exports.getExpenseReportByExpenseType = (groupId, year, callback) => {
	var match = {
		$match: {
			status: 3, 
			_groupId: mongoose.Types.ObjectId(groupId), 
			expenseDate: {
				$gte: new Date(year+"-01-01T00:00:00.0Z"), 
				$lte: new Date(year+"-12-31T00:00:00.0Z")
			}
		}
	};
	var group = {
		$group: {
			_id: "$expenseType",
			expense: {$sum: '$amount'}
		}
	};
	var project = {
		$project: {
			_id: 0,
			expenseType: "$_id",
			expense: 1	
		}
	};
	Transaction.aggregate([match, group, project], callback);
};

// Individual Group Report By Month
module.exports.getUserGroupReportByMonth = (groupId, year, Uid, callback) => {
	var unwind = {
		$unwind: "$initial" 
	};
	var match = {
		$match: {
			status: 3, 
			"initial._id": mongoose.Types.ObjectId(Uid), 
			_groupId: mongoose.Types.ObjectId(groupId),
			expenseDate: {
				$gte: new Date(year+"-01-01T00:00:00.0Z"), 
				$lte: new Date(year+"-12-31T00:00:00.0Z")
			}
		}
	};
	var group = {
		$group: {
			_id: {month: {$month: '$expenseDate'}, year: {$year: '$expenseDate'}},
			expense: {$sum: '$initial.amount'}
		}
	};
	var project = {
		$project: {
			_id: 0,
			month: "$_id.month",
			expense: 1	
		}
	};
	var sort = {
		$sort: {
			month: 1
		}
	};
	Transaction.aggregate([unwind, match, group, project, sort], callback);
};

// Individual Group Report By Catagory
module.exports.getUserGroupReportByCatagory = (groupId, year, Uid, callback) => {
	var unwind = {
		$unwind: "$initial" 
	};
	var match = {
		$match: {
			status: 3, 
			"initial._id": mongoose.Types.ObjectId(Uid), 
			_groupId: mongoose.Types.ObjectId(groupId),
			expenseDate: {
				$gte: new Date(year+"-01-01T00:00:00.0Z"), 
				$lte: new Date(year+"-12-31T00:00:00.0Z")
			}
		}
	};
	var group = {
		$group: {
			_id: "$expenseType",
			expense: {$sum: '$initial.amount'}
		}
	};
	var project = {
		$project: {
			_id: 0,
			expenseType: "$_id",
			expense: 1	
		}
	};
	Transaction.aggregate([unwind, match, group, project], callback);
};

// Individual Report By Month
module.exports.getUserReportByMonth = (year, Uid, callback) => {
	var unwind = {
		$unwind: "$initial" 
	};
	var match = {
		$match: {
			status: 3, 
			"initial._id": mongoose.Types.ObjectId(Uid), 
			expenseDate: {
				$gte: new Date(year+"-01-01T00:00:00.0Z"), 
				$lte: new Date(year+"-12-31T00:00:00.0Z")
			}
		}
	};
	var group = {
		$group: {
			_id: {month: {$month: '$expenseDate'}, year: {$year: '$expenseDate'}},
			expense: {$sum: '$initial.amount'}
		}
	};
	var project = {
		$project: {
			_id: 0,
			month: "$_id.month",
			expense: 1	
		}
	};
	var sort = {
		$sort: {
			month: 1
		}
	};
	Transaction.aggregate([unwind, match, group, project, sort], callback);
};

// Individual  Report By Catagory
module.exports.getUserReportByCatagory = (year, Uid, callback) => {
	var unwind = {
		$unwind: "$initial" 
	};
	var match = {
		$match: {
			status: 3, 
			"initial._id": mongoose.Types.ObjectId(Uid), 
			expenseDate: {
				$gte: new Date(year+"-01-01T00:00:00.0Z"), 
				$lte: new Date(year+"-12-31T00:00:00.0Z")
			}
		}
	};
	var group = {
		$group: {
			_id: "$expenseType",
			expense: {$sum: '$initial.amount'}
		}
	};
	var project = {
		$project: {
			_id: 0,
			expenseType: "$_id",
			expense: 1	
		}
	};
	Transaction.aggregate([unwind, match, group, project], callback);
};