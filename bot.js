var helper = require('./helper.js');
var models = require('./models.js');

var exports = module.exports = {};

exports.handleRequest = function (data, res) {

	// Create the user if does not exists, or find him in DB 
	var user = models.getUser(data.user_id, data.user_name, function(user){	

		//Case user says hi (wants to receive funds)
		if ( data.command == '/hi')
		{

			if(user == null)
			{
				var user = models.createUser(data.user_id, data.user_name, function(user){
					helper.response(res, 'Bienvenue sur le Slack de la Tic Valley ! \n
						Vous pouvez demander de l''aide et en donner dans les différents "Channels". \n
						Le Bangs est la monnaie virtuelle de l''entraide à la tic valley ! \n
						Pleins de cadeaux sont à gagner (Drone Parrot - balance withings etc...) pour les meilleurs contributeurs. \n
						Comme vous êtes nouveaux nous vous créditons de 200 bangs !\n
						\n
						Voici la liste des différentes fonctions : \n
						bangs 100 @bertran : Donne 100 bangs à bertran \n
						/mybangs : Vous renvoie votre nombre de bangs \n
						/allbangs : Renvoie le classement des bangs \n
\n
						Pour toutes questions contactez nous (sur slack hein ;-) ) @bertran @marion @julie @simon'  );
				});
			}

			else
			{
				helper.response(res, 'Vous êtes déjà inscrit :) ' );
			}

			return;

		}

		// If another command but user not registered
		if(user == null)
		{
			helper.response(res, 'Oulalala vous êtes pressé ! Commencez par dire : /hi ' );
			return;
		}


		//If user wants to know his own funds
		if (data.command == '/mybangs')
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
				helper.response(res, 'Olala il n''a pas encore utilisé de bangs, dites lui de dire /hi' );
				return;					
			}

			if (data.command != null)
			{
				helper.response(res, ' C''est bangs 100 @....  pas /bangs ' );
				return;					
			}

			models.processBank(user, function(user_bank){

				if (user_bank < amount)
				{
					helper.response(res, 'Tu as ' + user_bank + ' bangs. Pas assez pour envoyer ' + amount + ' !' );
					return;
				}

				// Finally save the bank operation in DB and display updated funds. 
				models.newOperation(user.slack_id, target.slack_id, amount, function(){

					models.processBank(user, function(new_user_bank){
						models.processBank(target, function(target_bank){

							var text = amount + ' bangs envoyés à ' +target.name + ' !\n';
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


