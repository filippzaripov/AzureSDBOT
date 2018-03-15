/**
* created by Filipp Zaripov
* This BOT creates incidents / change requests and send it as email to other email box 
*
*/

var restify = require('restify');
var builder = require('botbuilder');
var nodemailer = require('nodemailer'); 
var requestType, osOrService, availability, priority, serverServiceName, ip, comment, ticketNumber, contacts;
var smtp = 'smtp.yandex.ru';
var userMail = 'azure.notifications@yandex.ru';
var userPass = 'ilovemicrosoftazure';
var sendTo = 'philippsbucket@gmail.com';

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector(
{
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
	openIdMetadata: process.env.BotOpenIdMetadata
});

//send Email

var sendEmail = function(){
	
nodemailer.createTestAccount((err, account) => {

    let transporter = nodemailer.createTransport({
        host: smtp,
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: userMail, // generated ethereal user
            pass: userPass // generated ethereal password
        }
    });

    let mailOptions = {
        from: '"Azure BOT" '+userMail, // sender address
        to: sendTo, // list of receivers
        subject: requestType+'|Priority:'+priority+'|Stream:'+osOrService, // Subject line
        html: 'This is automatic message for creation '+requestType+'<br/><b>Comment from user:</b><br>'+comment+'<br>Contacts: '+contacts // html body
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
        // Preview only available when sending through an Ethereal account
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    });
});
	
}

// Listen for messages from users 
server.post('/api/messages', connector.listen());

var bot = new builder.UniversalBot(connector, function (session) {
    builder.Prompts.text(session,"This bot is created to raise incidents and change requests");
	session.send("/help - if you need help.");
});

bot.dialog('helper',[
		function(session){
			builder.Prompts.text(session, "/help - help." +
											"<BR/>/incident -  raise incident" +
											"<BR/>/change - raise change request");
		}
	]).triggerAction({
		matches: /^\/help$/i
	});

bot.dialog('incident', [
	function(session){
		requestType = 'Incident';
		builder.Prompts.text(session, "Please enter operating system, or 'service' if you have problem with service.");
	},
	function(session,results){
		osOrService = results.response;
		builder.Prompts.text(session,"Please provide server or service name.");
	},
	function(session,results){
		serverServiceName = results.response; 
		builder.Prompts.text(session,"Please provide some comments to this incident.");
	},
	function(session,results){
		comment = results.response;
		builder.Prompts.text(session,"Please provide priority of this incident.");
	},
	function(session, results){
		priority = results.response;
		builder.Prompts.text(session,"Please enter your email.");
	},
	function(session, results){
		contacts = results.response;
		builder.Prompts.text(session, 
		"Here is results of the request:<br/> OS: " + osOrService + 
		"<br/>Server/Service Name: " + serverServiceName + 
		"<br/>Contacts: " + contacts + 
		"<br/>Comment: " + comment);
		session.send("Please enter 'yes' if everything is correct. Or something if it's not");
	},
	function(session, results){	
		if(results.response == 'yes'){
			builder.Prompts.text(session,"Your request has been created.<BR/>Please wait for email with confirmation.");
			sendEmail();
			session.endDialog();
		}else{
			session.beginDialog('helper');
		}
	}
]).triggerAction({
		matches: /^\/incident$/i
});	

bot.dialog('change', [
	function(session){
		requestType = 'Change';
		builder.Prompts.text(session, "Here will be change request creation. Someday")
		session.endConversation();
		}
]).triggerAction({
		matches: /^\/change$/i
});


