var helper = require('./helper.js');
var models = require('./models.js');

var exports = module.exports = {};

exports.handleRequest = function (data, res) {

	// Create the user if does not exists, or find him in DB 
	var user = models.getUser(data.user_id, data.user_name, function(user){	

		//Case user says hi (wants to receive funds)
		if ( data.text.indexOf("hi") > -1)
		{

			if(user == null)
			{
				var user = models.createUser(data.user_id, data.user_name, function(user){
					helper.response(res, 'Welcome ' + user.name + ' !'  );
				});
			}

			else
			{
				helper.response(res, 'You are already registered ' + user.name  );
			}

			return;

		}

		// If another command but user not registered
		if(user == null)
		{
			helper.response(res, 'You must say " /bangs hi " first' );
			return;
		}


		//If user wants to know his own funds
		if (data.text.indexOf("mybangs") > -1)
		{
			models.processBank(user, function(user_bank){
				helper.response(res, 'You have : ' + user_bank + ' bangs' );
			});
			return;
		}


		//Else : parse message to find transaction information : how much and for who.

		// First find for who is the money
		helper.findTarget(data.text, function(target){

			// Find how much
			var amount = helper.findAmount(data.text);
			amount = parseInt(amount);


			if (amount == null)
			{
				helper.response(res, 'This is not a right command, no amout in your message' );
				return;					
			}

			if (target == null)
			{
				helper.response(res, 'Receiver does not exist or did not say " /bangs hi " ' );
				return;					
			}

			if (data.command != null)
			{
				helper.response(res, ' No slash for the message to be public ' );
				return;					
			}

			models.processBank(user, function(user_bank){

				if (user_bank < amount)
				{
					helper.response(res, 'You have ' + user_bank + ' bangs. Not enough to send ' + amount );
					return;
				}

				// Finally save the bank operation in DB and display updated funds. 
				var op = new models.Operation({ slack_id_sender: user.slack_id, slack_id_receiver: target.slack_id, amount: amount  });
				op.save(function(){

					models.processBank(user, function(new_user_bank){
						models.processBank(target, function(target_bank){

							var text = amount + ' bangs sent to ' +target.name + ' !\n';
							text += user.name +': ' + new_user_bank+ ' bangs\n';
							text += target.name +': ' + target_bank+ ' bangs\n';

							helper.response(res, text);

						});
					});

				});
			});


		});
	

	});

}


