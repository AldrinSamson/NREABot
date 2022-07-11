'use-strict'

//for env file
const dotenv = require('dotenv');
dotenv.config();
const fs = require('fs');
//for Viber Bot App
const ViberBot  = require('viber-bot').Bot;
const BotEvents = require('viber-bot').Events;
const TextMessage = require('viber-bot').Message.Text;
const PictureMessage = require('viber-bot').Message.Picture;
const ContactMessage = require('viber-bot').Message.Contact;
const RichMediaMessage = require('viber-bot').Message.RichMedia;
const KeyboardMessage = require('viber-bot').Message.Keyboard;
const winston = require('winston');
const toYAML = require('winston-console-formatter');
var request = require('request');

//For Airtable
const airtable = require('airtable');
const base = new airtable({apiKey: process.env.AIRTABLE_API_KEY}).base(process.env.AIRTABLE_BASE);
const recommendedBase = new airtable({apiKey: process.env.RECOMMENDED_MATCHING_API_KEY}).base(process.env.RECOMMENDED_MATCHING_BASE);
const exactBase = new airtable({apiKey: process.env.RECOMMENDED_MATCHING_API_KEY}).base(process.env.EXACT_MATCHING_BASE);

//for node-fetch
const fetch = require('node-fetch');

//For Airtable Plus
const AirTablePlus = require('airtable-plus');
const airTableInquire = new AirTablePlus({
	baseID: process.env.AIRTABLE_BASE,
	apiKey: process.env.AIRTABLE_API_KEY,
	tableName: 'Properties',
	// tableName: 'Imported table',
});
const airTableSearch = new AirTablePlus({
	baseID: process.env.AIRTABLE_BASE,
	apiKey: process.env.AIRTABLE_API_KEY,
	tableName: 'Inquiries',
});
const airTableReferral = new AirTablePlus({
	baseID: process.env.AIRTABLE_BASE,
	apiKey: process.env.AIRTABLE_API_KEY,
	tableName: 'Referral Codes',
});
const airTableUsers = new AirTablePlus({
	baseID: process.env.AIRTABLE_BASE,
	apiKey: process.env.AIRTABLE_API_KEY,
	tableName: 'Users',
});
const airTablePRC = new AirTablePlus({
	baseID: process.env.AIRTABLE_BASE,
	apiKey: process.env.AIRTABLE_API_KEY,
	tableName: 'Brokers (PRC)',
});
const airTableHLURB = new AirTablePlus({
	baseID: process.env.AIRTABLE_BASE,
	apiKey: process.env.AIRTABLE_API_KEY,
	tableName: 'Brokers (HLURB)',
});
const airTableProperties = new AirTablePlus({
	baseID: process.env.AIRTABLE_BASE,
	apiKey: process.env.AIRTABLE_API_KEY,
	tableName: 'Properties',
	// tableName: 'Imported table',
});
const airTableFeedback = new AirTablePlus({
	baseID: process.env.AIRTABLE_BASE,
	apiKey: process.env.AIRTABLE_API_KEY,
	tableName: 'Feedbacks',
});
const airTableCredentials = new AirTablePlus({
	baseID: process.env.AIRTABLE_BASE,
	apiKey: process.env.AIRTABLE_API_KEY,
	tableName: 'Credentials',
});
const airTableClients = new AirTablePlus({
	baseID: process.env.AIRTABLE_BASE,
	apiKey: process.env.AIRTABLE_API_KEY,
	tableName: 'Clients',
});
const airTableMatchingCriteria = new AirTablePlus({
	baseID: process.env.AIRTABLE_BASE,
	apiKey: process.env.AIRTABLE_API_KEY,
	tableName: 'Matching Criteria',
});

const airTableMatchingPayment = new AirTablePlus({
	baseID: process.env.AIRTABLE_BASE,
	apiKey: process.env.AIRTABLE_API_KEY,
	tableName: 'Proof of Payment',
});

// const airTableRecommended = new AirTablePlus({
// 	baseID: process.env.RECOMMENDED_MATCHING_BASE,
// 	apiKey: process.env.RECOMMENDED_MATCHING_API_KEY,
// 	tableName: 'Recommended Matches'
// })

// const airTableExact = new AirTablePlus({
// 	baseID: process.env.EXACT_MATCHING_BASE,
// 	apiKey: process.env.RECOMMENDED_MATCHING_API_KEY,
// 	tableName: 'Exact Matches'
// })


//for email-verifier
const validator = require("email-validator");

function createLogger() {
    const logger = new winston.Logger({
        level: "debug" // We recommend using the debug level for development
    });

    logger.add(winston.transports.Console, toYAML.config());
    return logger;
}

const logger = createLogger();

// Creating the bot with access token, name and avatar
const bot = new ViberBot(logger, {
    authToken: process.env.AUTH_TOKEN, // <--- Paste your token here
    name: process.env.BOT_NAME + " Bot",  // <--- Your bot name here
    avatar: process.env.AVATAR // It is recommended to be 720x720, and no more than 100kb.
});

//Webhook
const webhookURL = process.env.WEBHOOK_URL;
// const privateKey = fs.readFileSync('privkey.pem', 'utf8');
// const certificate = fs.readFileSync('cert.pem', 'utf8');
// const ca = fs.readFileSync('chain.pem', 'utf8');

// const credentials = {
//  	key: privateKey,
// 	cert: certificate,
// 	ca: ca
// };


//variables
var botName = process.env.BOT_NAME;

var isFloorMinEmpty = true;
var isFloorMaxEmpty = true;
var isLotMinEmpty = true;
var isLotMaxEmpty = true;
var isMinBudgetEmpty = true;
var isMaxBudgetEmpty = true;
var searchCondo;
var floorAreasearch = ``;
var lotAreasearch = ``;
var budgetsearch = ``;
var roomsearch = ``;
var furnishsearch = ``;
var parksearch = ``;
var commercialsearch = ``;
var formula = '';
var floormin = '';
var floormax = '';
var lotmin = '';
var lotmax = '';
var parkNum = '';
var budgetmin = '';
var budgetmax = '';
var condo = "";
var inquiryCode = '';
var regions = {"NCR":[ "MAKATI" ,"TAGUIG" ,"QUEZON CITY" ,"MANILA" ,"PASIG" ,"CALOOCAN" ,"LAS PINAS" ,"MALABON" ,"MANDALUYONG" ,"MARIKINA" ,"MUNTINLUPA" ,"NAVOTAS" ,"PARANAQUE" ,"PASAY CITY" ,"PATEROS" ,"SAN JUAN" ,"VALENZUELA" ],
"BATANGAS":[  "BATANGAS CITY" ,"LIPA" ,"STO. TOMAS" ,"TANAUAN" ,"AGONCILLO" ,"ALITAGTAG" ,"BALAYAN" ,"BALETE" ,"BAUAN" ,"CALACA" ,"CALATAGAN" ,"CUENCA" ,"IBAAN" ,"LAUREL" ,"LEMERY" ,"LIAN" ,"LOBO" ,"MABINI" ,"MALVAR" ,"MATAASNAKAHOY" ,"NASUGBU" ,"PADRE GARCIA" ,"ROSARIO" ,"SAN JOSE" ,"SAN JUAN" ,"SAN LUIS" ,"SAN NICOLAS" ,"SAN PASCUAL" ,"SANTA TERESITA" ,"TAAL" ,"TALISAY" ,"TAYSAN" ,"TINGLOY" ,"TUY" ],
"CAVITE":[ "BACOOR" ,"CAVITE" ,"DASMARINAS" ,"GENERAL TRIAS" ,"IMUS" ,"TAGAYTAY" ,"TRECE MARTIRES" ,"ALFONSO" ,"AMADEO" ,"CARMONA" ,"GEN. MARIANO ALVAREZ" ,"GENERAL EMILIO AGUINALDO" ,"INDANG" ,"KAWIT" ,"MAGALLANES" ,"MARAGONDON" ,"MENDEZ (MENDEZ-NUNEZ)" ,"NAIC" ,"NOVELETA" ,"ROSARIO" ,"SILANG" ,"TANZA" ,"TERNATE"  ],
"LAGUNA":["BINAN" ,"CABUYAO" ,"CALAMBA" ,"SAN PABLO" ,"SAN PEDRO" ,"SANTA CRUZ " ,"SANTA ROSA" ,"ALAMINOS" ,"BAY" ,"CALAUAN" ,"CAVINTI" ,"FAMY" ,"KALAYAAN" ,"LILIW" ,"LOS BANOS" ,"LUISIANA" ,"LUMBAN" ,"MABITAC" ,"MAGDALENA" ,"MAJAYJAY" ,"NAGCARLAN" ,"PAETE" ,"PAGSANJAN" ,"PAKIL" ,"PANGIL" ,"PILA" ,"RIZAL" ,"SANTA MARIA" ,"SINILOAN" ,"VICTORIA"   ],
"QUEZON":["LUCENA" ,"TAYABAS" ,"AGDANGAN" ,"ALABAT" ,"ATIMONAN" ,"BUENAVISTA" ,"BURDEOS" ,"CALAUAG" ,"CANDELARIA" ,"CATANAUAN" ,"DOLORES" ,"GENERAL LUNA" ,"GENERAL NAKAR" ,"GUINAYANGAN" ,"GUMACA" ,"INFANTA" ,"JOMALIG" ,"LOPEZ" ,"LUCBAN" ,"MACALELON" ,"MAUBAN" ,"MULANAY" ,"PADRE BURGOS" ,"PAGBILAO" ,"PANUKULAN" ,"PATNANUNGAN" ,"PEREZ" ,"PITOGO" ,"PLARIDEL" ,"POLILLO" ,"QUEZON" ,"REAL" ,"SAMPALOC" ,"SAN ANDRES" ,"SAN ANTONIO" ,"SAN FRANCISCO (AURORA)" ,"SAN NARCISO" ,"SARIAYA" ,"TAGKAWAYAN" ,"TIAONG" ,"UNISAN"   ],
"RIZAL":[ "ANTIPOLO" ,"CAINTA" ,"ANGONO" ,"BARAS" ,"BINANGONAN" ,"CARDONA" ,"JALA-JALA" ,"MORONG" ,"PILILLA" ,"RODRIGUEZ (MONTALBAN)" ,"SAN MATEO" ,"TANAY" ,"TAYTAY" ,"TERESA"  ],
"BULACAN":["MALOLOS " ,"MEYCAUAYAN" ,"SAN JOSE DEL MONTE" ,"ANGAT" ,"BALAGTAS (BIGAA)" ,"BALIUAG" ,"BOCAUE" ,"BULACAN" ,"BUSTOS" ,"CALUMPIT" ,"DONA REMEDIOS TRINIDAD" ,"GUIGUINTO" ,"HAGONOY" ,"MARILAO" ,"NORZAGARAY" ,"OBANDO" ,"PANDI" ,"PAOMBONG" ,"PLARIDEL" ,"PULILAN" ,"SAN ILDEFONSO" ,"SAN MIGUEL" ,"SAN RAFAEL" ,"SANTA MARIA"   ],
"PAMPANGA":[ "ANGELES" ,"MABALACAT CITY" ,"SAN FERNANDO" ,"APALIT" ,"ARAYAT" ,"BACOLOR" ,"CANDABA" ,"FLORIDABLANCA" ,"GUAGUA" ,"LUBAO" ,"MACABEBE" ,"MAGALANG" ,"MASANTOL" ,"MEXICO" ,"MINALIN" ,"PORAC" ,"SAN LUIS" ,"SAN SIMON" ,"SANTA ANA" ,"SANTA RITA" ,"SANTO TOMAS" ,"SASMUAN"  ],
"TARLAC":[ "TARLAC CITY" ,"ANAO" ,"BAMBAN" ,"CAMILING" ,"CAPAS" ,"CONCEPCION" ,"GERONA" ,"LA PAZ" ,"MAYANTOC" ,"MONCADA" ,"PANIQUI" ,"PURA" ,"RAMOS" ,"SAN CLEMENTE" ,"SAN JOSE" ,"SAN MANUEL" ,"SANTA IGNACIA" ,"VICTORIA"  ],
"CEBU":["BOGO" ,"CARCAR" ,"CEBU" ,"DANAO CITY" ,"LAPU-LAPU (OPON)" ,"MANDAUE" ,"NAGA" ,"TALISAY" ,"TOLEDO" ,"ALCANTARA" ,"ALCOY" ,"ALEGRIA" ,"ALOGUINSAN" ,"ARGAO" ,"ASTURIAS" ,"BADIAN" ,"BALAMBAN" ,"BANTAYAN" ,"BARILI" ,"BOLJOON" ,"BORBON" ,"CARMEN" ,"CATMON" ,"COMPOSTELA" ,"CONSOLACION" ,"CORDOVA" ,"DAANBANTAYAN" ,"DALAGUETE" ,"DUMANJUG" ,"GINATILAN" ,"LILOAN" ,"MADRIDEJOS" ,"MALABUYOC" ,"MEDELLIN" ,"MINGLANILLA" ,"MOALBOAL" ,"OSLOB" ,"PILAR" ,"PINAMUNGAJAN" ,"PORO" ,"RONDA" ,"SAMBOAN" ,"SAN FERNANDO" ,"OTHERS"   ],
"DAVAO DEL SUR":["DAVAO" ,"DIGOS" ,"BANSALAN" ,"HAGONOY" ,"KIBLAWAN" ,"MAGSAYSAY" ,"MALALAG" ,"MATANAO" ,"PADADA" ,"SANTA CRUZ" ,"SULOP"   ],
"PALAWAN":["PUERTO PRINCESA " ,"ABORLAN" ,"AGUTAYA" ,"ARACELI" ,"BALABAC" ,"BATARAZA" ,"BROOKE'S POINT" ,"BUSUANGA" ,"CAGAYANCILLO" ,"CORON" ,"CULION" ,"CUYO" ,"DUMARAN" ,"EL NIDO (BACUIT)" ,"KALAYAAN" ,"LINAPACAN" ,"MAGSAYSAY" ,"NARRA" ,"QUEZON" ,"RIZAL (MARCOS)" ,"ROXAS" ,"SAN VICENTE" ,"SOFRONIO ESPANOLA" ,"TAYTAY"   ],
"OTHER LUZON PROVINCES":["ABRA" ,"ALBAY" ,"APAYAO" ,"AURORA" ,"BATAAN" ,"BATANES" ,"BENGUET" ,"CAGAYAN" ,"CAMARINES NORTE" ,"CAMARINES SUR" ,"CATANDUANES" ,"IFUGAO" ,"ILOCOS NORTE" ,"ILOCOS SUR" ,"ISABELA" ,"KALINGA" ,"LA UNION" ,"MARINDUQUE" ,"MASBATE" ,"MOUNTAIN PROVINCE" ,"NUEVA ECIJA" ,"NUEVA VIZCAYA" ,"OCCIDENTAL MINDORO" ,"ORIENTAL MINDORO" ,"PANGASINAN" ,"QUIRINO" ,"ROMBLON" ,"SORSOGON" ,"ZAMBALES"   ],
"OTHER VISAYAS PROVINCES":[ "AKLAN" ,"ANTIQUE" ,"BILIRAN" ,"BOHOL" ,"CAPIZ" ,"EASTERN SAMAR" ,"GUIMARAS" ,"ILOILO" ,"LEYTE" ,"NEGROS OCCIDENTAL" ,"NEGROS ORIENTAL" ,"NORTHERN SAMAR" ,"SAMAR (WESTERN SAMAR)" ,"SIQUIJOR" ,"SOUTHERN LEYTE"  ],
"OTHER MIND. PROVINCES":["AGUSAN DEL NORTE" ,"AGUSAN DEL SUR" ,"BASILAN" ,"BUKIDNON" ,"CAMIGUIN" ,"COTABATO (NORTH COTABATO)" ,"DAVAO DE ORO (COMPOSTELA VALLEY)" ,"DAVAO DEL NORTE" ,"DAVAO OCCIDENTAL" ,"DAVAO ORIENTAL" ,"DINAGAT ISLANDS" ,"LANAO DEL NORTE" ,"LANAO DEL SUR" ,"MAGUINDANAO" ,"MISAMIS OCCIDENTAL" ,"MISAMIS ORIENTAL" ,"SARANGANI" ,"SOUTH COTABATO" ,"SULTAN KUDARAT" ,"SULU" ,"SURIGAO DEL NORTE" ,"SURIGAO DEL SUR" ,"TAWI-TAWI" ,"ZAMBOANGA DEL NORTE" ,"ZAMBOANGA DEL SUR" ,"ZAMBOANGA SIBUGAY"  ]
};



if (webhookURL) {
    const http = require('http');
    const https = require('https');
    const port = process.env.PORT || 8080;

    http.createServer(bot.middleware()).listen(port, () => bot.setWebhook(webhookURL));
    //https.createServer(credentials, bot.middleware()).listen(port, () => bot.setWebhook(webhookURL));
} else {
    logger.debug('Could not find the now.sh/Heroku environment variables. Please make sure you followed readme guide.');
}


// Validates that the input string is a valid date formatted as "mm/dd/yyyy"
function isValidDate(dateString)
{
    // First check for the pattern
    if(!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString))
        return false;

    // Parse the date parts to integers
    var parts = dateString.split("/");
    var day = parseInt(parts[1], 10);
    var month = parseInt(parts[0], 10);
    var year = parseInt(parts[2], 10);

    // Check the ranges of month and year
    if(year < 1000 || year > 3000 || month == 0 || month > 12)
        return false;

    var monthLength = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

    // Adjust for leap years
    if(year % 400 == 0 || (year % 100 != 0 && year % 4 == 0))
        monthLength[1] = 29;

    // Check the range of the day
    return day > 0 && day <= monthLength[month - 1];
};


//First Pop Up (Consent)
bot.onConversationStarted((userProfile, isSubscribed, context, onFinish) => {
	//onFinish(new TextMessage(`Hi there ${userProfile.name}, I am ${bot.name} and I would like to assist you. But before I can assist you, I would like to inform that I will take personal information for these transactions. Are you ok with this?`,
	//	keyboard_policy))
	//On conversation start keyboard
	const txt_policy = `Hi ${userProfile.name}, I'm ${botName} Bot, your awesome Real Estate bot. I'm expert in matching Direct listings with Direct requirements. Pressing the "JOIN" button means that you accept our Terms of Service and grant us access to your information. Thank you!`;
	const keyboard_policy = {
		"Type": "keyboard",
		"InputFieldState": "hidden",
		"Buttons": [{
			"Columns": 6,
			"Rows": 1, 
			"Text": "<font color=\"#494E67\"><b>JOIN</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "JOIN",
			"BgColor": "#edbf80",
			"TextOpacity": 100
		}, {
			"Columns": 6,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>View Terms of Service and Privacy Policy</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "open-url",
			"ActionBody": "https://nrealistings.com/termsprivacy ",
			"OpenURLType": "internal",
			"Silent": "true",
			"BgColor": "#c7b0e6",
			"TextOpacity": 100
		}]
	};
	if (isSubscribed) {
		//console.log(userProfile.id+"\n\n\n\n\n\n\n\n\n\n\n\n\n\n");
		//checkId(userProfile.id);
		//console.log(userProfile);
		//console.log(joined[userProfile.id])
		(async () => {
			//joined[id] = null;
			
			try {
				const readRes = await airTableUsers.read({
					filterByFormula: `{VIBER ID} = "${userProfile.id}"`
				});				
				if (readRes.length != 0) {
					//console.log(readRes[0].fields + "\n\n\n\n\n\n\n");
					//joined[userProfile.id] = readRes[0].fields;
					bot.sendMessage(userProfile, new TextMessage(`Welcome back ${userProfile.name}`,proceedKb, null, null, null, 3),
					{
						statusid: "accepted",
						userid: userProfile.id,
						userinfo : readRes[0].fields
					});
				} else {
					bot.sendMessage(userProfile, new TextMessage(`Welcome back ${userProfile.name}`,proceedKb, null, null, null, 3),
					{
						statusid: "accepted",
						userid: userProfile.id,	
					});
				}
					
			} catch (e){
				//console.log("Error\n\n\n\n\n\n\n");
				console.error(e)
			}
			
		}
		)();
		
		
		
		
	}
	else {
		//checkId(userProfile.id);
		(async () => {
			try {
				const readRes = await airTableUsers.read({
					filterByFormula: `{VIBER ID} = "${userProfile.id}"`
				});		

				if (readRes.length != 0) {
					console.log(readRes[0].fields + "\n\n\n\n\n\n\n");
					//joined[userProfile.id] = readRes[0].fields;
					bot.sendMessage(userProfile, new TextMessage(txt_policy, keyboard_policy, null, null, null, 4),
					{
						statusid: "accepted",
						userid: userProfile.id,
						userinfo : readRes[0].fields
					});
				} else {
					bot.sendMessage(userProfile, new TextMessage(txt_policy, keyboard_policy, null, null, null, 4),
					{
						statusid: "accepted",
						userid: userProfile.id
					});
				}
					
			} catch (e){
				//console.log("Error\n\n\n\n\n\n\n");
				console.error(e)
			}
		})();

	}

});


///////////////////////////////////////
// Start (Registration) Functions /////
///////////////////////////////////////


function getReferral(response,code) {
	
	const id = (async () => {
		//console.log("getting code\n\n\n\n\n");
		referral[response.userProfile.id] = "Unknown";
		
		try {
			const readRes = await airTableReferral.read({
				filterByFormula: `{Code} = "${code}"`
			});		
			//console.log(readRes);		
			if (readRes.length != 0)
				referral[response.userProfile.id] = readRes[0].fields.groupType;


		} catch (e){
			//console.log("Error\n\n\n\n\n\n\n");
			console.error(e)
		}
		
	}
	)();
	
	
	
}


let joined = [];
function checkId(id) {

	//console.log(id + "\n\n\n\n\n\n\n");	
	
	// <set up your connection>

	(async () => {
		joined[id] = null;
		
		try {
			const readRes = await airTableUsers.read({
				filterByFormula: `{VIBER ID} = "${id}"`
			});		
			console.log(readRes[0].fields + "\n\n\n\n\n\n\n");		
			if (readRes.length != 0) {
				joined[id] = readRes[0].fields;
			}
				
		} catch (e){
			//console.log("Error\n\n\n\n\n\n\n");
			console.error(e)
		}
		
	}
	)();
}


// function askReferral(response){
	
// 	const keyboard_referral = {
// 		"Type": "keyboard",
// 		"Buttons": [{
// 			"Text": "<font color=\"#494E67\"><b>I don't have one.</b></font>",
// 			//"TextSize": "medium",
// 			//"TextHAlign": "center",
// 			//"TextVAlign": "middle",
// 			"ActionType": "reply",
// 			"ActionBody": "no referral",
// 			"BgColor": "#edbf80",
// 			"Rows": 1,
// 			"Columns": 6
// 		}]
// 	};
// 	//To put the keyboard back, just replace the first null in the TextMessage() with the keyboard_referral variable 
// 	const text = `Please input your referral code below. Please note that your referral code will determine your registration type.`;
// 	response.send(new TextMessage(text, null,null, null, null, 3),
// 		{ 
// 			statusid: "referral",
// 			userid: response.userProfile.id,
// 			//groupType: ID
// 		});	
// }

function askUserType(response){
	
	const keyboard_askUserType = {
		"Type": "keyboard",
		"InputFieldState": "hidden",
		"Buttons": [{
			"Columns": 6,
			"Rows": 2,
			"Text": "<font color=\"#494E67\"><b>I'm an NREA Member</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Broker/Agent",
			"BgColor": "#edbf80",
		}
		, {
			"Columns": 6,
			"Rows": 2,
			"Text": "<font color=\"#494E67\"><b>Cancel</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "CANCEL1",
			"BgColor": "#FFAA88",
		}
	
	]
	};
	//To put the keyboard back, just replace the first null in the TextMessage() with the keyboard_referral variable 
	const text = `To verify yourself as a member please select the button`;
	response.send(new TextMessage(text, keyboard_askUserType,null, null, null, 3),
		{ 
			statusid: "referral",
			userid: response.userProfile.id,
			//groupType: ID
		});	
}

function askLicense(message, response){
	const txt_askLicense = `Do you have a PRC Broker's License?`;
	const keyboard_askLicense = {
		"Type": "keyboard",
		"InputFieldState": "hidden",
		"Buttons": [{
			"Columns": 3,
			"Rows": 2,
			"Text": "<font color=\"#494E67\"><b>Yes, I have my PRC Broker's License.</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Yes PRC",
			"BgColor": "#edbf80",
		}, {
			"Columns": 3,
			"Rows": 2,
			"Text": "<font color=\"#494E67\"><b>No, I'm non-broker NREA member.</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Non NREA",
			"BgColor": "#c7b0e6",
		}
		/*
		, 		
		{
			"Columns": 3,
			"Rows": 2,
			"Text": "<font color=\"#494E67\"><b>No, I don't have any of the above.</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "No license",
			"BgColor": "#c7b0e6",
		}
		*/
		, {
			"Columns": 6,
			"Rows": 2,
			"Text": "<font color=\"#494E67\"><b>Cancel</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "CANCEL1",
			"BgColor": "#FFAA88",
		}
	
	]
	};
	td = message.trackingData;
	if (validator.validate(message.text) == true){	
		td.statusid = "askLicense";
		td.emailReg = message.text;
		response.send(new TextMessage(txt_askLicense, keyboard_askLicense, null, null, null, 4),td);
	} else {
		response.send(new TextMessage("The email you've given us is invalid. Please send us a correct email.",null, null, null, null, 4),td);
	}
	
}

function askNoLicense(message,response){
	const noLicenseKb ={
			"Type": "keyboard",
			"InputFieldState": "hidden",
			"Buttons": [{
				"Columns": 6,
				"Rows": 1,
				"Text": "<font color=\"#494E67\"><b>Yes, I wish to join.</b></font>",
				"TextSize": "medium",
				"TextHAlign": "center",
				"TextVAlign": "middle",
				"ActionType": "reply",
				"ActionBody": "Yes join",
				"BgColor": "#edbf80",
			}, {
				"Columns": 6,
				"Rows": 1,
				"Text": "<font color=\"#494E67\"><b>Go Back to Main Menu</b></font>",
				"TextSize": "medium",
				"TextHAlign": "center",
				"TextVAlign": "middle",
				"ActionType": "reply",
				"ActionBody": "CANCEL1",
				"BgColor": "#FFAA88",
			}]
	}; 
	td = message.trackingData;
	td.statusid = "askNoLicense";
	response.send(new TextMessage('This group is currently available only for registered brokers. Do you wish to join?',noLicenseKb,null,null,null,4),td);	
}

///////////////////////////////////////
// End (Registration) Functions ///////
///////////////////////////////////////

//MAIN MENU FUNCTION
const mainMenuKb ={
	"Type": "keyboard",
	"InputFieldState": "hidden",
	"Buttons": [{
		"Columns": 6,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>I would like to enlist my property.</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Enlist",
		"BgColor": "#edbf80",
	}, {
		"Columns": 6,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>I'm looking for a property.</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Looking",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 6,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>My Account</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "My Account",
		"BgColor": "#ffff33",
	}, /*{
		"Columns": 6,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Share My Number</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "open-url",
		"ActionBody": "viber://pa?chatURI=parebtestbot",
		"OpenURLType": "internal",
		"Silent": "true",
	}*/]
};
function mainMenu(message, response){
	submissionPayload[response.userProfile.id] = null;
	searchPayload[response.userProfile.id] = null;
	inquirePayload[response.userProfile.id] = null;

	(async () => {
		try{
			const readRes = await airTableUsers.read({
				filterByFormula: `{Viber ID} = "${response.userProfile.id}"`,
			})

		//if (joined[response.userProfile.id].Validated != "Yes")
		
		if (readRes[0].fields.Validated != "Yes")
		{
			checkId(response.userProfile.id);
			const txt = `Unfortunately, your registration is not yet validated. I am your awesome Real Estate bot ${botName} Bot and I hope to be of service to you soon!`;
			response.send(new TextMessage(txt,checkKb,null,null,null,3),{
				statusid: "reg-confirm",
				userid: response.userProfile.id,
				nameReg: readRes[0].fields["Name"],
				groupType: readRes[0].fields["Group"],
				subGroup: readRes[0].fields["Sub Group"]	
			});
		} 
		else {
			response.send(new TextMessage(`Hi I'm ${botName} Bot, your awesome Real Estate bot. I'm expert in matching Direct listings with Direct requirements. How may I help you today?`, mainMenuKb,null,null,null,4),{
				statusid: "mainMenu",
				userid: response.userProfile.id,
				nameReg: readRes[0].fields["Name"],
				groupType: readRes[0].fields["Group"],
				subGroup: readRes[0].fields["Sub Group"]
			})
		}
		} catch (e){
			console.error(e)
		}
	})();
}

//////////////////////////////////////
// START MAIN ENLIST Functions ///////
//////////////////////////////////////

function mainEnlistStart(message, response){
	const enlistStartKb ={
		"Type": "keyboard",
		"InputFieldState": "hidden",
		"Buttons": [{
			"Columns": 6,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>I'm the property owner. I give consent for brokers and agents registered in "+botName+" Bot to contact me.</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Enlist Owner",
			"BgColor": "#edbf80",
		}, {
			"Columns": 6,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>I'm helping the property owner with his/her property. I give consent for brokers and agents registered in "+botName+" Bot to contact me</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Enlist help",
			"BgColor": "#c7b0e6",
		}, {
			"Columns": 6,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>I'm a real estate broker/working for a real estate broker.</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Enlist broker",
			"BgColor": "#edbf80",
		}, {
			"Columns": 6,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>GO BACK TO MAIN MENU</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "CANCEL2",
			"BgColor": "#FFAA88",
		}]
	}; 
	td = message.trackingData;
	td.statusid = "mainEnlistStart";
	if(td.groupType == "Broker"){
		response.send(new TextMessage(`Please be reminded to only enlist DIRECT listings. Please press the confirm button to proceed to the next section.`, confirm2Kb,null,null,null,4),td);
	} else {
		response.send(new TextMessage(`I would gladly assist you. Which are you?`, enlistStartKb,null,null,null,4),td);
	}
	
}

function mainEnlistHelp(message, response){
	const enlistHelpKb ={
		"Type": "keyboard",
		"InputFieldState": "hidden",
		"Buttons": [{
			"Columns": 3,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>Immediate family</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Immediate family",
			"BgColor": "#edbf80",
		}, {
			"Columns": 3,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>Non-immediate family</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Non-immediate family",
			"BgColor": "#c7b0e6",
		}, {
			"Columns": 3,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>Personal friend</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Personal friend",
			"BgColor": "#c7b0e6",
		}, {
			"Columns": 3,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>Friend of friend</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Friend of friend",
			"BgColor": "#edbf80",
		}, {
			"Columns": 3,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>My boss</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "My boss",
			"BgColor": "#edbf80",
		}, {
			"Columns": 3,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>None of the above. I'll specify</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "None of the above",
			"BgColor": "#c7b0e6",
		}, {
			"Columns": 6,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>GO BACK TO MAIN MENU</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "CANCEL2",
			"BgColor": "#FFAA88",
		}]
	}; 
	td = message.trackingData;
	td.statusid = "mainEnlistStart";
	response.send(new TextMessage(`What is your relationship to the property owner?`, enlistHelpKb,null,null,null,4),td);
}

function mainEnlistNotbroker(message, response){
	const notBrokerkb = {
		"Type": "keyboard",
		"InputFieldState": "hidden",
		"Buttons": [{
			"Columns": 3,
			"Rows": 2,
			"Text": "<font color=\"#494E67\"><b>Yes, I wish to join</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "None broker join",
			"BgColor": "#edbf80",
		}, {
			"Columns": 3,
			"Rows": 2,
			"Text": "<font color=\"#494E67\"><b>No</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "None broker no",
			"BgColor": "#c7b0e6",
		}, {
			"Columns": 6,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>GO BACK TO MAIN MENU</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "CANCEL2",
			"BgColor": "#FFAA88",
		}]
	}
	td = message.trackingData;
	td.statusid = "mainMenu";
	response.send(new TextMessage(`Uh oh, I'm really sorry. You are currently registered as a client. If you're a licensed broker, please send a copy of your PRC ID to our Admin.`,mainMenuKb,null,null,null,3),td);	
}

function mainEnlistPropertyType(message,response){
	const propertyKb = {
		"Type": "keyboard",
		"InputFieldState": "hidden",
		"Buttons": [{
			"Columns": 3,
			"Rows": 2,
			"Text": "<font color=\"#494E67\"><b>For Sale</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "For Sale",
			"BgColor": "#edbf80",
		}, {
			"Columns": 3,
			"Rows": 2,
			"Text": "<font color=\"#494E67\"><b>For Lease</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "For Lease",
			"BgColor": "#c7b0e6",
		}, {
			"Columns": 6,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>GO BACK TO MENU</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "CANCEL2",
			"BgColor": "#FFAA88",
		}]
	}
	td = message.trackingData;
	td.statusid = "mainEnlistPropertyType";
	td.relationship = message.text;
	if(message.text == "Confirm"){
		td.relationship = "Enlist Broker";
	}	
	response.send(new TextMessage(`Wonderful! Is the property for sale or for lease? Please be reminded to only enlist DIRECT listings.`, propertyKb, null, null, null, 4),td);
}

function mainEnlistPropertyType2(message, response){
	const propertyKb2 = {
		"Type": "keyboard",
		"InputFieldState": "hidden",
		"Buttons": [{
			"Columns": 3,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>Residential Condo</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Residential Condo",
			"BgColor": "#edbf80",
		}, {
			"Columns": 3,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>Residential House & Lot</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Residential House & Lot",
			"BgColor": "#c7b0e6",
		}, {
			"Columns": 3,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>Residential Vacant Lot</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Residential Vacant Lot",
			"BgColor": "#c7b0e6",
		}, {
			"Columns": 3,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>Office Space</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Office Space",
			"BgColor": "#edbf80",
		}, {
			"Columns": 3,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>Commercial with Improvements</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Commercial with Improvements",
			"BgColor": "#edbf80",
		}, {
			"Columns": 3,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>Commercial Vacant Lot</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Commercial Vacant Lot",
			"BgColor": "#c7b0e6",
		}, {
			"Columns": 3,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>Industrial with Improvements</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Industrial with Improvements",
			"BgColor": "#c7b0e6",
		}, {
			"Columns": 3,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>Industrial Vacant Lot</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Industrial Vacant Lot",
			"BgColor": "#edbf80",
		}, {
			"Columns": 3,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>Raw Land</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Raw Land",
			"BgColor": "#edbf80",
		}, {
			"Columns": 3,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>GO BACK TO MAIN MENU</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "CANCEL2",
			"BgColor": "#FFAA88",
		}
		]
	}
	td = message.trackingData;
	td.statusid = "mainEnlistPropertyType2";
	td.property = message.text;
	response.send(new TextMessage(`Alright! Next, please provide type of property.`, propertyKb2, null, null, null, 4),td);
}

function mainEnlistFurnishing(message,response){
	const furnishKb = {
		"Type": "keyboard",
		"InputFieldState": "hidden",
		"Buttons": [{
			"Columns": 3,
			"Rows": 2,
			"Text": "<font color=\"#494E67\"><b>Bare</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Bare",
			"BgColor": "#edbf80",
		}, {
			"Columns": 3,
			"Rows": 2,
			"Text": "<font color=\"#494E67\"><b>Furnished</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Furnished",
			"BgColor": "#c7b0e6",
		}, {
			"Columns": 6,
			"Rows": 2,
			"Text": "<font color=\"#494E67\"><b>GO BACK TO MAIN MENU</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "CANCEL2",
			"BgColor": "#FFAA88",
		}]
	}
	td = message.trackingData;
	let text = message.text.split(",").join("");
	
	
		//td.statusid = "mainEnlistFurnishing";
		//td.lotArea = text;
		
		let txt;
			switch (td.propertyType) {

				case "Residential Condo":
					if((isNaN(text) == false && Math.sign(text) == 1 && text != 0) || message.text == 'None'){
						td.statusid = "mainEnlistFurnishing";
						td.floorArea = text;
						txt = `How is the furnishings?`;
						response.send(new TextMessage(txt,furnishKb, null,null,null,4),td);
					} else {
						response.send(new TextMessage(`You have entered an incorrect value for your Floor Area. I only accept numbers.`,cancel2Kb, null,null,null,4),td);
					}
					break;
				case "Residential House & Lot":
					if((isNaN(text) == false && Math.sign(text) == 1 && text != 0) || message.text == 'None'){
						td.statusid = "mainEnlistParking";
						td.lotArea = text;
						txt = `How is the furnishings?`;
						response.send(new TextMessage(txt,furnishKb, null,null,null,4),td);
					} else {
						response.send(new TextMessage(`You have entered an incorrect value for your Lot Area. I only accept numbers.`,cancel2Kb, null,null,null,4),td);
					}
					break;
				case "Office Space":
					if((isNaN(text) == false && Math.sign(text) == 1 && text != 0) || message.text == 'None'){
						td.statusid = "mainEnlistFurnishing";
						td.floorArea = text;
						txt = `How is the furnishings?`;
						response.send(new TextMessage(txt,furnishKb, null,null,null,4),td);
					} else {
						response.send(new TextMessage(`You have entered an incorrect value for your Floor Area. I only accept numbers.`,cancel2Kb, null,null,null,4),td);
					}
					break;
				case "Commercial with Improvements":
					//txt = `This section is for the furnishings. Since the property type is ${td.propertyType}, the furnishings is N/A. Press Confirm to continue"`;
					//response.send(new TextMessage(txt,none2Kb, null,null,null,4),td);
					break;
				case "Industrial with Improvements":
					//txt = `This section is for the furnishings. Since the property type is ${td.propertyType}, the furnishings is N/A. Press Confirm to continue"`;
					//response.send(new TextMessage(txt,none2Kb, null,null,null,4),td);
					break;
				case "Residential Vacant Lot":
					//txt = `This section is for the furnishings. Since the property type is ${td.propertyType}, the furnishings is N/A. Press Confirm to continue"`;
					//response.send(new TextMessage(txt,none2Kb, null,null,null,4),td);
					break;
				case "Commercial Vacant Lot":
					//txt = `This section is for the furnishings. Since the property type is ${td.propertyType}, the furnishings is N/A. Press Confirm to continue"`;
					//response.send(new TextMessage(txt,none2Kb, null,null,null,4),td);
					break; 
				case "Industrial Vacant Lot":
					//txt = `This section is for the furnishings. Since the property type is ${td.propertyType}, the furnishings is N/A. Press Confirm to continue"`;
					//response.send(new TextMessage(txt,none2Kb, null,null,null,4),td);
					break;
				case "Raw Land":
					//txt = `This section is for the furnishings. Since the property type is ${td.propertyType}, the furnishings is N/A. Press Confirm to continue"`;
					//response.send(new TextMessage(txt,none2Kb, null,null,null,4),td);
					break;
			}
		
	
}


//////////////////////////////////////
// END MAIN ENLIST Functions /////////
//////////////////////////////////////

//////////////////////////////////////
// START MAIN INQUIRE Functions //////
//////////////////////////////////////

function mainInquireStart(message, response){
	const inquireStartKb ={
		"Type": "keyboard",
		"InputFieldState": "hidden",
		"Buttons": [{
			"Columns": 6,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>I'm the buyer/tenant.</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Inquire buyer",
			"BgColor": "#edbf80",
		}, {
			"Columns": 6,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>I'm helping another person search for a property.</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Inquire help",
			"BgColor": "#c7b0e6",
		}, {
			"Columns": 6,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>I'm a real estate broker/working for a real estate broker and finding a property for my client.</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Inquire broker",
			"BgColor": "#edbf80",
		},{
			"Columns": 6,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>GO BACK TO MAIN MENU</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "CANCEL2",
			"BgColor": "#FFAA88",
		}]
	}; 
	td = message.trackingData;
	td.statusid = "mainInquireStart";
	if(td.groupType == "Broker"){
		response.send(new TextMessage(`Please be reminded to only enter DIRECT requirements. Please press the confirm button to proceed to the next section.`, confirm2Kb,null,null,null,4),td);
	} else {
		response.send(new TextMessage(`I would gladly assist you. Which are you?`, inquireStartKb,null,null,null,4),td);
	}
}

function mainInquireHelp(message, response){
	const inquireHelpKb ={
		"Type": "keyboard",
		"InputFieldState": "hidden",
		"Buttons": [{
			"Columns": 3,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>Immediate family</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Immediate family",
			"BgColor": "#edbf80",
		}, {
			"Columns": 3,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>Non-immediate family</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Non-immediate family",
			"BgColor": "#c7b0e6",
		}, {
			"Columns": 3,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>Personal friend</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Personal friend",
			"BgColor": "#c7b0e6",
		}, {
			"Columns": 3,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>Friend of friend</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Friend of friend",
			"BgColor": "#edbf80",
		}, {
			"Columns": 3,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>My boss</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "My boss",
			"BgColor": "#edbf80",
		}, {
			"Columns": 3,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>None of the above. I'll specify</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "None of the above",
			"BgColor": "#c7b0e6",
		}, {
			"Columns": 6,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>GO BACK TO MAIN MENU</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "CANCEL2",
			"BgColor": "#FFAA88",
		}]
	}; 
	td = message.trackingData;
	td.statusid = "mainInquireStart";
	response.send(new TextMessage(`What is your relationship to the person looking for a property?`, inquireHelpKb,null,null,null,4),td);
}
function mainInquireNotbroker(message, response){
	const notBrokerkb = {
		"Type": "keyboard",
		"InputFieldState": "hidden",
		"Buttons": [{
			"Columns": 3,
			"Rows": 2,
			"Text": "<font color=\"#494E67\"><b>Yes, I wish to join</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "None broker join",
			"BgColor": "#edbf80",
		}, {
			"Columns": 3,
			"Rows": 2,
			"Text": "<font color=\"#494E67\"><b>No</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "None broker no",
			"BgColor": "#c7b0e6",
		}, {
			"Columns": 6,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>GO BACK TO MAIN MENU</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "CANCEL2",
			"BgColor": "#FFAA88",
		}]
	}
	td = message.trackingData;
	td.statusid = "mainMenu";
	response.send(new TextMessage(`Uh oh, I'm really sorry. You are currently registered as a client. If you're a licensed broker, please re-register as a licensed broker or salesperson/agent.`,mainMenuKb,null,null,null,3),td);	
}
function mainInquirePropertyType(message,response){
	const propertyKb = {
		"Type": "keyboard",
		"InputFieldState": "hidden",
		"Buttons": [{
			"Columns": 3,
			"Rows": 2,
			"Text": "<font color=\"#494E67\"><b>To Buy</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "To Buy",
			"BgColor": "#edbf80",
		}, {
			"Columns": 3,
			"Rows": 2,
			"Text": "<font color=\"#494E67\"><b>To Lease</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "To Lease",
			"BgColor": "#c7b0e6",
		}, {
			"Columns": 6,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>GO BACK TO MAIN MENU</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "CANCEL2",
			"BgColor": "#FFAA88",
		}]
	}
	td = message.trackingData;
	td.statusid = "mainInquirePropertyType";
	td.relationship = message.text;
	if(message.text == "Confirm"){
		if ( td.groupType == "Broker" ){
			td.relationship = "Enlist Broker";
		} else if ( td.groupType == "Agent" ){
			td.relationship = "Enlist Agent";
		}else if( td.groupType == "Client" ){
			td.relationship = "Enlist Client";
		}
	}	
	response.send(new TextMessage(`Wonderful! Are you looking for a property to buy or to lease? Please be reminded to only enter DIRECT requirements.`, propertyKb, null, null, null, 4),td);
}

function mainInquirePropertyType2(message, response){
	const propertyKb2 = {
		"Type": "keyboard",
		"InputFieldState": "hidden",
		"Buttons": [{
			"Columns": 3,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>Residential Condo</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Residential Condo",
			"BgColor": "#edbf80",
		}, {
			"Columns": 3,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>Residential House & Lot</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Residential House & Lot",
			"BgColor": "#c7b0e6",
		}, {
			"Columns": 3,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>Residential Vacant Lot</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Residential Vacant Lot",
			"BgColor": "#c7b0e6",
		}, {
			"Columns": 3,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>Office Space</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Office Space",
			"BgColor": "#edbf80",
		}, {
			"Columns": 3,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>Commercial with Improvements</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Commercial with Improvements",
			"BgColor": "#edbf80",
		}, {
			"Columns": 3,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>Commercial Vacant Lot</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Commercial Vacant Lot",
			"BgColor": "#c7b0e6",
		}, {
			"Columns": 3,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>Industrial with Improvements</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Industrial with Improvements",
			"BgColor": "#c7b0e6",
		}, {
			"Columns": 3,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>Industrial Vacant Lot</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Industrial Vacant Lot",
			"BgColor": "#edbf80",
		}, {
			"Columns": 3,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>Raw Land</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Raw Land",
			"BgColor": "#edbf80",
		}, {
			"Columns": 3,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>GO BACK TO MAIN MENU</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "CANCEL2",
			"BgColor": "#FFAA88",
		}
		]
	}
	td = message.trackingData;
	td.statusid = "mainInquirePropertyType2";
	td.property = message.text;
	response.send(new TextMessage(`Excellent! What type of property are you looking for?`, propertyKb2, null, null, null, 4),td);
}

function mainInquireFurnishing(message,response){
	const furnishKb = {
		"Type": "keyboard",
		"InputFieldState": "hidden",
		"Buttons": [{
			"Columns": 3,
			"Rows": 2,
			"Text": "<font color=\"#494E67\"><b>Bare</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Bare",
			"BgColor": "#edbf80",
		}, {
			"Columns": 3,
			"Rows": 2,
			"Text": "<font color=\"#494E67\"><b>Furnished</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Furnished",
			"BgColor": "#c7b0e6",
		// }, {
		// 	"Columns": 6,
		// 	"Rows": 2,
		// 	"Text": "<font color=\"#494E67\"><b>GO BACK TO MAIN MENU</b></font>",
		// 	"TextSize": "medium",
		// 	"TextHAlign": "center",
		// 	"TextVAlign": "middle",
		// 	"ActionType": "reply",
		// 	"ActionBody": "CANCEL2",
		// 	"BgColor": "#FFAA88",
		// }]
		}, {
			"Columns": 3,
			"Rows": 2,
			"Text": "<font color=\"#494E67\"><b>SKIP ALL</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "SKIPALL",
			"BgColor": "#c7b0e6",
		}, {
			"Columns": 3,
			"Rows": 2,
			"Text": "<font color=\"#494E67\"><b>GO BACK TO MAIN MENU</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "CANCEL2",
			"BgColor": "#FFAA88",
		}]
	}
	td = message.trackingData;	
	let text = message.text.split(",").join("");
	
		//td.statusid = "mainInquireFurnishing";
		//td.lotAreaMax = text;
		
		let txt;
		switch (td.propertyType) {
			case "Residential Condo":
				if ((isNaN(text) == false && Math.sign(text) == 1 && text != 0) || message.text == 'None'){
					td.statusid = "mainInquireFurnishing";
					td.floorAreaMax = text;
					txt = `How is the furnishings?`;
					response.send(new TextMessage(txt,furnishKb, null,null,null,4),td);
				} else {
					response.send(new TextMessage(`You have entered an incorrect value for your Maximum Floor Area. Please try again.`,cancel2Kb),td);
				}	
				break;
			case "Residential House & Lot": 
				// if ((isNaN(text) == false && Math.sign(text) == 1 && text != 0) || message.text == 'None'){
				// 	td.statusid = "mainInquireParking";
				// 	td.lotAreaMax = text;
				// 	txt = `How is the furnishings?`;
				// 	response.send(new TextMessage(txt,furnishKb, null,null,null,4),td);
				// } else {
				// 	response.send(new TextMessage(`You have entered an incorrect value for your Maximum Lot Area. Please try again.`,cancel2Kb),td);
				// }
				break;
			case "Office Space":
				if ((isNaN(text) == false && Math.sign(text) == 1 && text != 0) || message.text == 'None'){
					// td.statusid = "mainInquireFurnishing";
					td.statusid = "mainInquireParking";
					td.floorAreaMax = text;
					txt = `How is the furnishings?`;
					response.send(new TextMessage(txt,furnishKb, null,null,null,4),td);
				} else {
					response.send(new TextMessage(`You have entered an incorrect value for your Maximum Floor Area. Please try again.`,cancel2Kb),td);
				}
				break;				
			case "Commercial with Improvements":
				//txt = `This section is for the furnishings. Since the property type is ${td.propertyType}, the furnishings is N/A. Press Confirm to continue"`;
				//response.send(new TextMessage(txt,none2Kb, null,null,null,4),td);
				break;
			case "Industrial with Improvements":
				//txt = `This section is for the furnishings. Since the property type is ${td.propertyType}, the furnishings is N/A. Press Confirm to continue"`;
				//response.send(new TextMessage(txt,none2Kb, null,null,null,4),td);
				break;
			case "Residential Vacant Lot":
				//txt = `This section is for the furnishings. Since the property type is ${td.propertyType}, the furnishings is N/A. Press Confirm to continue"`;
				//response.send(new TextMessage(txt,none2Kb, null,null,null,4),td);
				break;
			case "Commercial Vacant Lot":
				//txt = `This section is for the furnishings. Since the property type is ${td.propertyType}, the furnishings is N/A. Press Confirm to continue"`;
				//response.send(new TextMessage(txt,none2Kb, null,null,null,4),td);
				break; 
			case "Industrial Vacant Lot":
				//txt = `This section is for the furnishings. Since the property type is ${td.propertyType}, the furnishings is N/A. Press Confirm to continue"`;
				//response.send(new TextMessage(txt,none2Kb, null,null,null,4),td);
				break;
			case "Raw Land":
				//txt = `This section is for the furnishings. Since the property type is ${td.propertyType}, the furnishings is N/A. Press Confirm to continue"`;
				//response.send(new TextMessage(txt,none2Kb, null,null,null,4),td);
				break;
		}
	
	
}	

function showInquire2(id, formula) {

	(async () => {
		try {
		
			const readRes = await airTableInquire.read({
				filterByFormula: formula,
			})
			//console.log(readRes);		
			inquirePayload[id] = readRes;
			console.log(inquirePayload[id]);
		} catch (e){
			console.error(e)
		}
		
	
	})();

}

function showInquire(message,response){
	td = message.trackingData;
	// var formula = '';
	
	isFloorMinEmpty = true;
	isFloorMaxEmpty = true;
	isLotMinEmpty = true;
	isLotMaxEmpty = true;
	isMinBudgetEmpty = true;
	isMaxBudgetEmpty = true;
	searchCondo;
	floorAreasearch = ``;
	lotAreasearch = ``;
	budgetsearch = ``;
	roomsearch = ``;
	furnishsearch = ``;
	parksearch = ``;
	commercialsearch = ``;
	formula = '';
	floormin = '';
	floormax = '';
	lotmin = '';
	lotmax = '';
	parkNum = '';
	budgetmin = '';
	budgetmax = '';
	condo = "";
	
	(async () => {
		try {
			/*
		let apiQuery = "https://us1.locationiq.com/v1/reverse.php?key=e4300dd3e8dc91"
		let lat =`&lat=`+ message.trackingData.latitude;
		let lon = `&lon=`+ message.trackingData.longitude;
		let apiResponse = await fetch(apiQuery + lat + lon + `&format=json`);
		let loc = await apiResponse.json();
		let city = loc.address.city;
		let town = loc.address.town;
		let municipality = loc.address.municipality;
		let county = loc.address.county;
		let region = loc.address.region;
		let state = loc.address.state;
		let address = loc.display_name;
		let area_arr = address.split(",");
		let len = area_arr.length;
		//console.log("display_name: " + address);
		//console.log(area_arr);
		//console.log(len);
		
		let area = " ";
		let zip = area_arr[len-2];
		if (isNaN(area_arr[len-2])) { //check if not a zip code; l-1 is country
			area = `${area_arr[0]},${area_arr[1]},${area_arr[2]}`;
			zip = "null";
			//console.log(area_arr[len-2]);
			//console.log("Area: " + area);
		}
		else if (len >= 8) {
			area = `${area_arr[len-7]},${area_arr[len-6]},${area_arr[len-5]},${area_arr[len-4]},${area_arr[len-3]}`;
			//console.log("Area: " + area);
		}
		else if (len == 7) {
			area = `${area_arr[len-6]},${area_arr[len-5]},${area_arr[len-4]},${area_arr[len-3]}`;
		} else {
			area = `${area_arr[len-5]},${area_arr[len-4]},${area_arr[len-3]}`;
			//console.log("Area: " + area);

		}

		
		if(city == null){
			if (town != null) {
				city = town;
			}
			else if (municipality != null) {
				city = municipality;
			}
			else if (county != null) {
				city = county;
			} else {
				city == "null";		
			}
		}
		if(region == null){
			if (state != null) {
				region = state;
			} else {
				region == "null";
			}
		}
		*/


		// let floorAreasearch = ``;
		// let lotAreasearch = ``;
		// let budgetsearch = ``;
		// let roomsearch = ``;
		// let furnishsearch = ``;
		// let parksearch = ``;
		// let commercialsearch = ``;

		//Furnishing 
		if(message.trackingData.furnishing){
			furnishsearch = `{Furnishing} = "${td.furnishing}",`;
		}

		//Commercial Type
		if(message.trackingData.commercialType){
			commercialsearch = `{Commercial Type} = "${td.commercialType}",`;
		}

		//Floor Area
		// let floormin = td.floorAreaMin;
		// let floormax = td.floorAreaMax;
		floormin = td.floorAreaMin;
		floormax = td.floorAreaMax;
		
		if(td.floorAreaMin && (isNaN(message.trackingData.floorAreaMin) == false)){
			//floormin = 0;
			floorAreasearch = `{Floor Area} >= "${parseFloat(floormin)}",`
			isFloorMinEmpty = false;
		}
		if(td.floorAreaMax && (isNaN(message.trackingData.floorAreaMax) == false)){
			//floormax = 1000000000;
			floorAreasearch = `{Floor Area} <= "${parseFloat(floormax)}",`
			isFloorMaxEmpty = false;
		}
		if(td.floorAreaMax && (isNaN(message.trackingData.floorAreaMax) == false) &&
			td.floorAreaMin && (isNaN(message.trackingData.floorAreaMin) == false)){
			floorAreasearch = `{Floor Area} >= "${parseFloat(floormin)}",{Floor Area} <= "${parseFloat(floormax)}",`
			isFloorMinEmpty = false;
			isFloorMaxEmpty = false;
		}

		//Lot Area
		// let lotmin = td.lotAreaMin;
		// let lotmax = td.lotAreaMax;
		lotmin = td.lotAreaMin;
		lotmax = td.lotAreaMax;

		if(td.lotAreaMin && (isNaN(message.trackingData.lotAreaMin) == false)){
			//lotmin = 0;
			lotAreasearch = `{Lot Area} >= "${parseInt(lotmin)}",`
			console.log("abcd pumasok sa lotmin")
			isLotMinEmpty = false
		}
		if(td.lotAreaMax && (isNaN(message.trackingData.lotAreaMax) == false)){
			//lotmax = 1000000000;
			lotAreasearch = `{Lot Area} <= "${parseInt(lotmax)}",`
			console.log("efgh pumasok sa lotmax")
			isLotMaxEmpty = false
		}
		if((td.lotAreaMin && (isNaN(message.trackingData.lotAreaMin) == false)) &&
			(td.lotAreaMax && (isNaN(message.trackingData.lotAreaMax) == false))){
			lotAreasearch = `{Lot Area} >= "${parseInt(lotmin)}", {Lot Area} <= "${parseInt(lotmax)}",`
			console.log("ijkl pumasok sa parehas")
			isLotMinEmpty = false
			isLotMaxEmpty = false
		}

		//Park Slots
		// let parkNum = message.trackingData.parkingSlots;
		parkNum = message.trackingData.parkingSlots;
		if(td.parkingSlots == "With Parking"){
			parksearch = `{Parking Slots} = "${parkNum}",`;
		}

		//Rooms
		if(td.rooms && (isNaN(message.trackingData.rooms) == false)){
			// roomsearch = `{Number of Rooms} >= "${td.rooms}",`;	
			roomsearch = `{Number of Rooms} = "${td.rooms}",`;
		}

		//Budget
		budgetmin = td.minimumPrice;
		budgetmax = td.maximumPrice;

		//console.log(isNaN(message.trackingData.minimumPrice))
		if(td.minimumPrice && (isNaN(message.trackingData.minimumPrice) == false)){
			//budgetmin = 0;
			budgetsearch = `{Price} >= "${budgetmin}",`
			isMinBudgetEmpty = false
		} 
		if(td.maximumPrice && (isNaN(message.trackingData.maximumPrice) == false)){
			//budgetmax = 1000000000;
			budgetsearch = `{Price} <= "${budgetmax}",`
			isMaxBudgetEmpty = false
		}
		if((td.maximumPrice && (isNaN(message.trackingData.maximumPrice) == false)) &&
			(td.minimumPrice && (isNaN(message.trackingData.minimumPrice) == false))){
			budgetsearch = `{Price} <= "${budgetmax}", {Price} >= "${budgetmin}",`	
			isMinBudgetEmpty = false
			isMaxBudgetEmpty = false
		}
		
		//console.log(zip);
		//Condo/Area/Building
		// let condo = ""
		condo = ""
		if(td.condoName){
			condo = td.condoName.toLowerCase().replace(" ","");
		}
		//`LOWER({Location Name}) = "${condo}",`
		searchCondo = `SEARCH("${condo}", LOWER(SUBSTITUTE(SUBSTITUTE({Location Name}, " ", ""), " ", ""))),`

		if (td.property == "To Buy"){
			if (td.condoName == "None" && (td.baranggay != "Unknown" || td.baranggay != "All" || td.baranggay != "ALL")) {
				// formula = `AND({Property Purpose} = "For Sale", LOWER({Location}) = LOWER("${td.location}"),` +
				formula = `AND({Property Purpose} = "For Sale", {Region/State} = "${td.region}",{City/Town} = "${td.city}" ,` +
				furnishsearch + 
				lotAreasearch +
				`{Property Type} = "${td.propertyType}",` +
				commercialsearch + 
				floorAreasearch +
				budgetsearch + 
				roomsearch + 
				parksearch+
				`{Validated} = "1")`;
			} else if(td.condoName != "None" && (td.baranggay != "Unknown" || td.baranggay != "All" || td.baranggay != "ALL")) {
				// formula = `AND({Property Purpose} = "For Sale", LOWER({Location}) = LOWER("${td.location}"),` +
				formula = `AND({Property Purpose} = "For Sale", {Region/State} = "${td.region}",{City/Town} = "${td.city}" ,` +
				searchCondo +
				furnishsearch + 
				lotAreasearch +
				`{Property Type} = "${td.propertyType}",` + 
				commercialsearch +
				floorAreasearch +
				budgetsearch + 
				roomsearch + 
				parksearch+
				`{Validated} = "1")`;
			} else if(td.condoName == "None" && (td.baranggay == "Unknown" || td.baranggay == "All" || td.baranggay != "ALL")){
				formula = `AND({Property Purpose} = "For Sale", {Region/State} = "${td.region}",{City/Town} = "${td.city}" ,` +
				furnishsearch + 
				lotAreasearch +
				`{Property Type} = "${td.propertyType}",` + 
				commercialsearch +
				floorAreasearch +
				budgetsearch + 
				roomsearch + 
				parksearch+
				`{Validated} = "1")`;
			} else if(td.condoName != "None" && (td.baranggay == "Unknown" || td.baranggay == "All" || td.baranggay != "ALL")) {
				formula = `AND({Property Purpose} = "For Sale", {Region/State} = "${td.region}",{City/Town} = "${td.city}" ,` +
				searchCondo +
				commercialsearch +
				furnishsearch + 
				lotAreasearch +
				`{Property Type} = "${td.propertyType}",` + 
				floorAreasearch +
				budgetsearch + 
				roomsearch + 
				parksearch+
				`{Validated} = "1")`;
			}

			
		} else if (td.property == "To Lease"){
			if (td.condoName == "None" && (td.baranggay != "Unknown" || td.baranggay != "All" || td.baranggay != "ALL")) {
				// formula = `AND({Property Purpose} = "For Lease", LOWER({Location}) = LOWER("${td.location}"),` +
				formula = `AND({Property Purpose} = "For Lease", {Region/State} = "${td.region}",{City/Town} = "${td.city}" ,` +
				furnishsearch + 
				lotAreasearch +
				`{Property Type} = "${td.propertyType}",` + 
				commercialsearch +
				floorAreasearch +
				budgetsearch + 
				roomsearch + 
				parksearch+
				`{Validated} = "1")`;
			} else if(td.condoName != "None" && (td.baranggay != "Unknown" || td.baranggay != "All" || td.baranggay != "ALL")) {
				// formula = `AND({Property Purpose} = "For Lease", LOWER({Location}) = LOWER("${td.location}"),` +
				formula = `AND({Property Purpose} = "For Lease", {Region/State} = "${td.region}",{City/Town} = "${td.city}" ,` +
				searchCondo +
				furnishsearch + 
				lotAreasearch +
				`{Property Type} = "${td.propertyType}",` + 
				commercialsearch +
				floorAreasearch +
				budgetsearch + 
				roomsearch + 
				parksearch+
				`{Validated} = "1")`;
			} else if(td.condoName == "None" && (td.baranggay == "Unknown" || td.baranggay == "All" || td.baranggay != "ALL")){
				formula = `AND({Property Purpose} = "For Lease", {Region/State} = "${td.region}",{City/Town} = "${td.city}" ,` +
				furnishsearch + 
				lotAreasearch +
				`{Property Type} = "${td.propertyType}",` + 
				commercialsearch +
				floorAreasearch +
				budgetsearch + 
				roomsearch + 
				parksearch+
				`{Validated} = "1")`;
			} else if(td.condoName != "None" && (td.baranggay == "Unknown" || td.baranggay == "All" || td.baranggay != "ALL")) {
				formula = `AND({Property Purpose} = "For Lease", {Region/State} = "${td.region}",{City/Town} = "${td.city}" ,` +
				searchCondo +
				furnishsearch + 
				lotAreasearch +
				`{Property Type} = "${td.propertyType}",` + 
				commercialsearch +
				floorAreasearch +
				budgetsearch + 
				roomsearch + 
				parksearch+
				`{Validated} = "1")`;
			}

		
		}

		// formula = `AND({Property Purpose} = "For Sale",{Region/State} = "NCR",{Property Type} = "Residential House & Lot",OR({City/Town} = "MANDALUYONG",{City/Town} = "PASIG",{City/Town} = "SAN JUAN",{City/Town} = "QUEZON CITY",{City/Town} = "MANILA",{City/Town} = "QUEZON CITY"),AND({Number of Rooms} >= "5"}, {Number of Rooms} <= "20"),AND({Floor Area} >= "0"}, {Floor Area} <= "999"))`
		console.log(formula)
		td.formula = formula;
		const readRes = await airTableInquire.read({
			filterByFormula: formula,
		})
			console.log(readRes);		
			formulaStore[message.trackingData.userid] = formula;
			inquirePayload[message.trackingData.userid] = readRes;
			//console.log(inquirePayload[message.trackingData.userid])

		} catch (e){
			console.error(`error: ${e}`)
		}
		
	
	})();
	
}

async function updateBroadcastPreference(nameSplit,message,response,td){
	var selectedRegion = nameSplit[0];
	var selectedCity = nameSplit[1];
	var selectedPropertyTypes = nameSplit[2];
	const updateRes = await airTableUsers.updateWhere(`{Viber ID} = "${message.trackingData.userid}"`, {
		"Preferred Region": selectedRegion, "Preferred Cities": selectedCity, "Preferred Property Types": selectedPropertyTypes
	})
	response.send(new TextMessage("Thank you for updating your broadcast preference", cancel2Kb),td);
}

async function setSpecialMatches(message,response,td){
	const readRes = await airTableSearch.read({
		filterByFormula: `{Special Matches} = "0"`,
	})

	if(readRes.length > 0){
		for (var i = 0; i < readRes.length; i++) {
			td = readRes[i].fields
			console.log(`td: ${JSON.stringify(td)}`)

			td.property = readRes[i].fields["Property Purpose"];
			td.propertyType = readRes[i].fields["Property Type"];
			td.groupType = readRes[i].fields["Group Type"];
			td.region = readRes[i].fields["Region/State"];
			td.city = readRes[i].fields["City/Town"];
			if(readRes[i].fields["Baranggay"]){
				td.baranggay = readRes[i].fields["Baranggay"];
			}
			if(readRes[i].fields["Floor Area Min"]){
				td.floorAreaMin = readRes[i].fields["Floor Area Min"];
			}
			if(readRes[i].fields["Floor Area Max"]){
				td.floorAreaMin = readRes[i].fields["Floor Area Max"];
			}
			if(readRes[i].fields["Lot Area Min"]){
				td.floorAreaMin = readRes[i].fields["Lot Area Min"];
			}
			if(readRes[i].fields["Lot Area Max"]){
				td.floorAreaMin = readRes[i].fields["Lot Area Max"];
			}
			if(readRes[i].fields["Number of Rooms"]){
				td.rooms = readRes[i].fields["Number of Rooms"];
			}
			if(readRes[i].fields["Location Name"]){
				td.condoName = readRes[i].fields["Location Name"];
			}
			if(readRes[i].fields["Furnishing"]){
				td.furnishing = readRes[i].fields["Furnishing"];
			}
			if(readRes[i].fields["Parking Slots"]){
				td.parkingSlots = readRes[i].fields["Parking Slots"]
			}
			if(readRes[i].fields["Minimum Budget"]){
				td.minimumPrice = readRes[i].fields["Minimum Budget"];
			}
			if(readRes[i].fields["Minimum Budget"]){
				td.maximumPrice = readRes[i].fields["Minimum Budget"];
			}

			floormin = td.floorAreaMin;
			floormax = td.floorAreaMax;
			
			if(td.floorAreaMin && (isNaN(td.floorAreaMin) == false)){
				//floormin = 0;
				floorAreasearch = `{Floor Area} >= "${parseFloat(floormin)}",`
				isFloorMinEmpty = false;
			}
			if(td.floorAreaMax && (isNaN(td.floorAreaMax) == false)){
				//floormax = 1000000000;
				floorAreasearch = `{Floor Area} <= "${parseFloat(floormax)}",`
				isFloorMaxEmpty = false;
			}
			if(td.floorAreaMax && (isNaN(td.floorAreaMax) == false) &&
				td.floorAreaMin && (isNaN(td.floorAreaMin) == false)){
				floorAreasearch = `{Floor Area} >= "${parseFloat(floormin)}",{Floor Area} <= "${parseFloat(floormax)}",`
				isFloorMinEmpty = false;
				isFloorMaxEmpty = false;
			}

			//Lot Area
			// let lotmin = td.lotAreaMin;
			// let lotmax = td.lotAreaMax;
			lotmin = td.lotAreaMin;
			lotmax = td.lotAreaMax;

			if(td.lotAreaMin && (isNaN(td.lotAreaMin) == false)){
				//lotmin = 0;
				lotAreasearch = `{Lot Area} >= "${parseInt(lotmin)}",`
				isLotMinEmpty = false
			}
			if(td.lotAreaMax && (isNaN(td.lotAreaMax) == false)){
				//lotmax = 1000000000;
				lotAreasearch = `{Lot Area} <= "${parseInt(lotmax)}",`
				isLotMaxEmpty = false
			}
			if((td.lotAreaMin && (isNaN(td.lotAreaMin) == false)) &&
				(td.lotAreaMax && (isNaN(td.lotAreaMax) == false))){
				lotAreasearch = `{Lot Area} >= "${parseInt(lotmin)}", {Lot Area} <= "${parseInt(lotmax)}",`
				isLotMinEmpty = false
				isLotMaxEmpty = false
			}

			//Park Slots
			// let parkNum = message.trackingData.parkingSlots;
			parkNum = td.parkingSlots;
			if(td.parkingSlots == "With Parking"){
				parksearch = `{Parking Slots} = "${parkNum}",`;
			}

			//Rooms
			if(td.rooms && (isNaN(td.rooms) == false)){
				// roomsearch = `{Number of Rooms} >= "${td.rooms}",`;	
				roomsearch = `{Number of Rooms} = "${td.rooms}",`;
			}

			//Budget
			budgetmin = td.minimumPrice;
			budgetmax = td.maximumPrice;

			//console.log(isNaN(message.trackingData.minimumPrice))
			if(td.minimumPrice && (isNaN(td.minimumPrice) == false)){
				//budgetmin = 0;
				budgetsearch = `{Price} >= "${budgetmin}",`
				isMinBudgetEmpty = false
			} 
			if(td.maximumPrice && (isNaN(td.maximumPrice) == false)){
				//budgetmax = 1000000000;
				budgetsearch = `{Price} <= "${budgetmax}",`
				isMaxBudgetEmpty = false
			}
			if((td.maximumPrice && (isNaN(td.maximumPrice) == false)) &&
				(td.minimumPrice && (isNaN(td.minimumPrice) == false))){
				budgetsearch = `{Price} <= "${budgetmax}", {Price} >= "${budgetmin}",`	
				isMinBudgetEmpty = false
				isMaxBudgetEmpty = false
			}

			condo = ""
			if(td.condoName){
				condo = td.condoName.toLowerCase().replace(" ","");
			}
			searchCondo = `SEARCH("${condo}", LOWER(SUBSTITUTE(SUBSTITUTE({Location Name}, " ", ""), " ", ""))),`;

			inquiryCode = readRes[i].fields["Inquiry Code"];

			setMatches(message,td,inquiryCode);
			const updateRes = await airTableSearch.updateWhere(`{Inquiry Code} = "${inquiryCode}"`, {
				"Special Matches": "1"
			});
			response.userProfile.id = message.trackingData.userid;
			response.send(new TextMessage("Matches has been added", cancel2Kb),td);
		}
	} else {
		response.userProfile.id = message.trackingData.userid;
		response.send(new TextMessage("There are no special matches to be added", cancel2Kb),td);
	}
}

async function setMatches(message,td,inquiryCode){
	// for matches inquiry

	var matchesPropertyPurpose = "WTB"
	if(td.property == "To Lease"){
		matchesPropertyPurpose = "WTL"
	}

	var matchesLocationName = ""
	if(td.condoName){
		matchesLocationName = ` - ${td.condoName}`
	}

	var matchesFloorArea = ""
	if(isFloorMaxEmpty == true && isFloorMinEmpty == false){
		matchesFloorArea = ` ${td.floorAreaMin}sqm FA \n`
	} else if(isFloorMaxEmpty == false && isFloorMinEmpty == true){
		matchesFloorArea = ` ${td.floorAreaMax}sqm FA \n`
	} else if(isFloorMaxEmpty == false && isFloorMinEmpty == false){
		matchesFloorArea = ` ${td.floorAreaMin}sqm - ${td.floorAreaMax}sqm FA \n`
	}

	var matchesLotArea = ""
	if(isLotMaxEmpty == true && isLotMinEmpty == false){
		matchesLotArea = ` ${td.lotAreaMin}sqm LA \n`
	} else if(isLotMaxEmpty == false && isLotMinEmpty == true){
		matchesLotArea = ` ${td.lotAreaMax}sqm LA \n`
	} else if(isLotMaxEmpty == false && isLotMinEmpty == false){
		matchesLotArea = ` ${td.lotAreaMin}sqm - ${td.lotAreaMax}sqm LA \n`
	}

	var matchesFurnishing = ""
	if(message.trackingData.furnishing && message.trackingData.furnishing != "None"){
		matchesFurnishing = ` ${td.furnishing} \n`
	}

	var matchesBudget = ""
	if(isMaxBudgetEmpty == true && isMinBudgetEmpty == false){
		matchesBudget = ` ${td.minimumPrice} budget`
	} else if(isMaxBudgetEmpty == false && isMinBudgetEmpty == true){
		matchesBudget = ` ${td.maximumPrice} budget`
	} else if(isMaxBudgetEmpty == false && isMinBudgetEmpty == false){
		matchesBudget = ` ${td.minimumPrice} - ${td.maximumPrice} budget`
	}

	var inquiryMatches = `${matchesPropertyPurpose} - ${td.region} - ${td.city} - ${td.baranggay} \n ${td.propertyType}${matchesLocationName} \n${matchesFloorArea}${matchesLotArea}${matchesFurnishing}${matchesBudget}`
	
	// var inquiryMatches = `${matchesPropertyPurpose} - ${td.region} - ${td.city} - ${td.baranggay} \n ${td.propertyType} ${matchesLocationName}`

	// for profile summary of matches
	var requesterProfileSummary

	if(td.groupType == "Broker"){
		const query = await airTablePRC.read({
			filterByFormula: `{Viber ID} = "${message.trackingData.userid}"`
		});

		const query2 = await airTableHLURB.read({
			filterByFormula: `{Viber ID} = "${message.trackingData.userid}"`
		});

		if(query && query.length != 0){
			requesterProfileSummary = query[0].fields["Profile Summary"]
		} else {
			requesterProfileSummary = query2[0].fields["Profile Summary"]
		}
	} else {
		const query3 = await airTableCredentials.read({
			filterByFormula: `{ID} = "rec23iYg4V4fGnX3C"`
			// filterByFormula: `{ID} = "recq1P9ND0tU7pFjt"`
		});
		requesterProfileSummary = query3[0].fields["Summary"]
	}
	
	// for exact matches
	const readRes2 = await airTableUsers.read({
		filterByFormula: `{Viber ID} = "${message.trackingData.userid}"`
	})

	console.log(`USers readtable: ${JSON.stringify(readRes2)}`)
	// var isSubscribed = false 
	if(readRes2[0].fields["Subscribed"] == "1"){

		var exactPropertyPurpose
		if(td.property == "To Buy"){
			exactPropertyPurpose = `{Property Purpose} = "For Sale"`
		} else {
			exactPropertyPurpose = `{Property Purpose} = "For Lease"`
		}

		var exactPropertyName = ""
		if(td.condoName != "None"){
			exactPropertyName = searchCondo
		}
		
		var exactFurnishings = ""
		if(td.propertyType == "Residential Condo" && furnishsearch){
			exactFurnishings = furnishsearch
		}

		var exactBedrooms = ""
		if(td.rooms){
			if(td.propertyType == "Residential Condo" && (parseInt(td.rooms) == 0 || parseInt(td.rooms) == 1)){
				exactBedrooms = `OR({Number of Rooms} = "0", {Number of Rooms} = "1"),`
			} else {
				exactBedrooms = `{Number of Rooms} = "${td.rooms}",`
			}
		}

		var exactFormula = `AND(${exactPropertyPurpose}, {Region/State} = "${td.region}",{City/Town} = "${td.city}" ,` +
			exactPropertyName +
			exactFurnishings + 
			lotAreasearch +
			// `{Property Type} = "${td.propertyType}",` + 
			// commercialsearch +
			floorAreasearch +
			// budgetsearch + 
			exactBedrooms + 
			`{Validated} = "1")`;

		console.log(`exactFormula: ${exactFormula}`)

		const updateRes3 = await airTableSearch.updateWhere(`{Inquiry Code} = "${inquiryCode}"`, {
			"Exact Formula": exactFormula, "Profile Summary": requesterProfileSummary, "Exact Inquiry": inquiryMatches
		});

		const exactRes = await airTableInquire.read({
			filterByFormula: exactFormula,
		})

		console.log(`exactRes: ${exactRes.length}`)
		if(exactRes.length > 0){
			// console.log("pumasok sa for exact matches " + exactRes[0]["fields"]["Name"])
			for (var i = 0; i < exactRes.length; i++) {
				var image1 = "";
				var image2 = "";
				var image3 = "";
				var image4 = "";
				var image5 = "";

				console.log(JSON.stringify(exactRes[i]["fields"]))
				if(exactRes[i]["fields"]["Property Image1"]){
					image1 = exactRes[i]["fields"]["Property Image1"][0]["url"]
				}
				if(exactRes[i]["fields"]["Property Image2"]){
					image2 = exactRes[i]["fields"]["Property Image2"][0]["url"]
				}
				if(exactRes[i]["fields"]["Property Image3"]){
					image3 = exactRes[i]["fields"]["Property Image3"][0]["url"]
				}
				if(exactRes[i]["fields"]["Property Image4"]){
					image4 = exactRes[i]["fields"]["Property Image4"][0]["url"]
				}
				if(exactRes[i]["fields"]["Property Image5"]){
					image5 = exactRes[i]["fields"]["Property Image5"][0]["url"]
				}

				const query = await airTablePRC.read({
					filterByFormula: `{Viber ID} = "${exactRes[i]["fields"]["Viber ID"]}"`
				});

				const query2 = await airTableHLURB.read({
					filterByFormula: `{Viber ID} = "${exactRes[i]["fields"]["Viber ID"]}"`
				});

				const query3 = await airTableCredentials.read({
					filterByFormula: `{ID} = "rec23iYg4V4fGnX3C"`
					// filterByFormula: `{ID} = "recq1P9ND0tU7pFjt"`
				});

				var profileSummary
				if(query && query.length != 0){
					profileSummary = query[0].fields["Profile Summary"]
				} else if(query2 && query2.length != 0){
					profileSummary = query2[0].fields["Profile Summary"]
				} else {
					profileSummary = query3[0].fields["Summary"]	
				}

				const fields = {
					"Name": exactRes[i]["fields"]["Name"],
					"Property Relation": exactRes[i]["fields"]["Property Relation"],
					"Property Purpose": exactRes[i]["fields"]["Property Purpose"],
					"Property Type": exactRes[i]["fields"]["Property Type"],
					"Commercial Type": exactRes[i]["fields"]["Commercial Type"],
					"Location": (exactRes[i]["fields"]["Location"]).toUpperCase(),
					"City/Town": (exactRes[i]["fields"]["City/Town"]).toUpperCase(),
					"Baranggay": (exactRes[i]["fields"]["Baranggay"]).toUpperCase(),
					"Region/State": (exactRes[i]["fields"]["Region/State"]).toUpperCase(),
					"Location Name": exactRes[i]["fields"]["Location Name"],
					"Number of Rooms": parseInt(exactRes[i]["fields"]["Number of Rooms"]),
					"Floor Area": parseFloat(exactRes[i]["fields"]["Floor Area"]),
					"Lot Area": parseFloat(exactRes[i]["fields"]["Lot Area"]),
					"Furnishing": exactRes[i]["fields"]["Furnishing"],
					"Parking Slots": exactRes[i]["fields"]["Parking Slots"],
					"Price": parseFloat(exactRes[i]["fields"]["Price"]),
					"Property Image1": [{"url": image1}],
					"Property Image2": [{"url": image2}],
					"Property Image3": [{"url": image3}],
					"Property Image4": [{"url": image4}],
					"Property Image5": [{"url": image5}],
					"Property Detail": exactRes[i]["fields"]["Property Detail"],
					"Group Type": exactRes[i]["fields"]["Group Type"],
					"Sub Group": exactRes[i]["fields"]["Sub Group"],
					"Commission Rate": exactRes[i]["fields"]["Commission Rate"],
					"Viber ID": exactRes[i]["fields"]["Viber ID"],
					"Validated": "1",
					"Broadcasted": "0",
					"Profile Summary": profileSummary,
					"Requester Viber Id": message.trackingData.userid,
					"Requester Profile Summary": requesterProfileSummary,
					"Requester Formula": exactFormula,
					"Inquiry": inquiryMatches,
					"Inquiry Code": inquiryCode,
					"Enlisting Code": exactRes[i]["fields"]["Enlisting Code"]
				};

				exactBase('Exact Matches').create([
				{
					"fields": fields
				}], function(err, records) {
					if (err) {
						console.error(err);
						return;
					}
				});
			}
		}

	// for recommended matches
		var recommendedMatchesFormula = `AND(`;
		var recommendedPropertyPurpose = ``;
		if(td.property == "To Buy"){
			recommendedPropertyPurpose = `{Property Purpose} = "For Sale",`
		} else {
			recommendedPropertyPurpose = `{Property Purpose} = "For Lease",`
		}
		// var recommendedPropertyPurpose = `{Property Purpose} = "${td.property}",`
		var recommendedRegion = `{Region/State} = "${td.region}",`
		var recommendedPropertyType = `{Property Type} = "${td.propertyType}"`
		var recommendedCity = ``;
		var recommendedBedrooms = ``;
		var recommendedLotArea = ``;
		var recommendedFloorArea = ``;
		var recommendedLocationName = ``;

		// city
		if(td.region == "NCR" && td.propertyType != "Residential Condo"){
			
			var newCity = (td.city).toUpperCase().replace(" CITY", "")
			const readRes3 = await airTableMatchingCriteria.read({
				filterByFormula: `SEARCH(LOWER("${newCity}"), LOWER({Match Groupings})) >= 1`
			})
			console.log(`readRes3: ${JSON.stringify(readRes3)}` )
			var recommendedCityArray = readRes3
			if(recommendedCityArray.length > 0){
				recommendedCity = `,OR(`
				for (var i = 0; i < recommendedCityArray.length; i++) {
					// console.log(recommendedCityArray[i])
					try{
						// console.log(recommendedCityArray[i]["fields"]["Match Groupings"])
						var cityArray = recommendedCityArray[i]["fields"]["Match Groupings"].split(',')
						for (var j = 0; j < cityArray.length; j++) {
							// console.log(cityArray[i])
							if(i == 0 && j == 0){
								if(cityArray[j] == "Quezon" || cityArray[j] == "Pasay"){
									recommendedCity += `{City/Town} = "${(cityArray[j]).toUpperCase() + ' CITY'}"`	
								} else {
									recommendedCity += `{City/Town} = "${(cityArray[j]).toUpperCase()}"`	
								}
							} else {
								if(cityArray[j] == "Quezon" || cityArray[j] == "Pasay"){
									recommendedCity += `,{City/Town} = "${(cityArray[j]).toUpperCase() + ' CITY'}"`	
								} else {
									recommendedCity += `,{City/Town} = "${(cityArray[j]).toUpperCase()}"`	
								}

								// recommendedCity += `,{City/Town} = "${(cityArray[j]).toUpperCase() + ' CITY'}"`	
							}
						}
					} catch(e){
						console.log(`error ${e}`)
					}

				}
				recommendedCity += ")"
				console.log(recommendedCity)
			}
		} else if(td.region == "NCR" && td.propertyType == "Residential Condo"){
			recommendedCity = `,{City/Town} = "${td.city}"`
		}

		// bedrooms
		if(td.rooms && (isNaN(message.trackingData.rooms) == false)){
			const readRes4 = await airTableMatchingCriteria.read({
				filterByFormula: `{Matching Type} = "Bedroom"`,
			})
			var bedroomArray = readRes4
			if(bedroomArray.length > 0){
				for (var i = 0; i < bedroomArray.length; i++) {
					// console.log(recommendedCityArray[i])
					try{
						// console.log(bedroomArray[i]["fields"]["Match Groupings"])
						var bedroomRangeArray = bedroomArray[i]["fields"]["Match Groupings"].split('-')
						if(parseInt(bedroomRangeArray[0]) <= parseInt(td.rooms) && parseInt(bedroomRangeArray[1]) >= parseInt(td.rooms)){
							recommendedBedrooms = `,AND({Number of Rooms} >= "${bedroomRangeArray[0]}", {Number of Rooms} <= "${bedroomRangeArray[1]}")`
						}
					} catch(e){
						console.log(`error: ${e}`)
					}
				}
			}
		}

		// floor area condo
		if(isFloorMinEmpty == false && isFloorMaxEmpty == false && td.propertyType == "Residential Condo"){
			const readRes5 = await airTableMatchingCriteria.read({
				filterByFormula: `{Matching Type} = "Floor Area Condo"`,
			})
			var floorAreaArray = readRes5
			if(floorAreaArray.length > 0){
				for (var i = 0; i < floorAreaArray.length; i++) {
					// console.log(recommendedCityArray[i])
					try{
						// console.log(bedroomArray[i]["fields"]["Match Groupings"])
						var floorAreaSplitArray = floorAreaArray[i]["fields"]["Match Groupings"].split('-')
						if(parseInt(floorAreaSplitArray[0]) <= parseInt(floormin) && parseInt(floorAreaSplitArray[1]) >= parseInt(floormax)){
							recommendedFloorArea = `,AND({Floor Area} >= "${floorAreaSplitArray[0]}", {Floor Area} <= "${floorAreaSplitArray[1]}")`
						}
					} catch(e){
						console.log(`error: ${e}`)
					}
				}
			}
		} else if(isFloorMinEmpty == false && isFloorMaxEmpty == true && td.propertyType == "Residential Condo"){
			const readRes5 = await airTableMatchingCriteria.read({
				filterByFormula: `{Matching Type} = "Floor Area Condo"`,
			})
			var floorAreaArray = readRes5
			if(floorAreaArray.length > 0){
				for (var i = 0; i < floorAreaArray.length; i++) {
					// console.log(recommendedCityArray[i])
					try{
						// console.log(bedroomArray[i]["fields"]["Match Groupings"])
						var floorAreaSplitArray = floorAreaArray[i]["fields"]["Match Groupings"].split('-')
						if(parseInt(floorAreaSplitArray[0]) <= parseInt(floormin) && parseInt(floorAreaSplitArray[1]) >= parseInt(floormin)){
							recommendedFloorArea = `,AND({Floor Area} >= "${floorAreaSplitArray[0]}", {Floor Area} <= "${floorAreaSplitArray[1]}")`
						}
					} catch(e){
						console.log(`error: ${e}`)
					}
				}
			}
		} else if(isFloorMinEmpty == true && isFloorMaxEmpty == false && td.propertyType == "Residential Condo"){
			const readRes5 = await airTableMatchingCriteria.read({
				filterByFormula: `{Matching Type} = "Floor Area Condo"`,
			})
			var floorAreaArray = readRes5
			if(floorAreaArray.length > 0){
				for (var i = 0; i < floorAreaArray.length; i++) {
					// console.log(recommendedCityArray[i])
					try{
						// console.log(bedroomArray[i]["fields"]["Match Groupings"])
						var floorAreaSplitArray = floorAreaArray[i]["fields"]["Match Groupings"].split('-')
						if(parseInt(floorAreaSplitArray[0]) <= parseInt(floormax) && parseInt(floorAreaSplitArray[1]) >= parseInt(floormax)){
							recommendedFloorArea = `,AND({Floor Area} >= "${floorAreaSplitArray[0]}", {Floor Area} <= "${floorAreaSplitArray[1]}")`
						}
					} catch(e){
						console.log(`error: ${e}`)
					}
				}
			}
		}
		
		// floor area non-condo
		if(isFloorMinEmpty == false && isFloorMaxEmpty == false && td.propertyType != "Residential Condo"){
			const readRes5 = await airTableMatchingCriteria.read({
				filterByFormula: `{Matching Type} = "Floor Area Non-Condo"`,
			})
			var floorAreaArray = readRes5
			if(floorAreaArray.length > 0){
				for (var i = 0; i < floorAreaArray.length; i++) {
					// console.log(recommendedCityArray[i])
					try{
						// console.log(bedroomArray[i]["fields"]["Match Groupings"])
						var floorAreaSplitArray = floorAreaArray[i]["fields"]["Match Groupings"].split('-')
						if(parseInt(floorAreaSplitArray[0]) <= parseInt(floormin) && parseInt(floorAreaSplitArray[1]) >= parseInt(floormax)){
							recommendedFloorArea = `,AND({Floor Area} >= "${floorAreaSplitArray[0]}", {Floor Area} <= "${floorAreaSplitArray[1]}")`
						}
					} catch(e){
						console.log(`error: ${e}`)
					}
				}
			}
		} else if(isFloorMinEmpty == false && isFloorMaxEmpty == true && td.propertyType != "Residential Condo"){
			const readRes5 = await airTableMatchingCriteria.read({
				filterByFormula: `{Matching Type} = "Floor Area Non-Condo"`,
			})
			var floorAreaArray = readRes5
			if(floorAreaArray.length > 0){
				for (var i = 0; i < floorAreaArray.length; i++) {
					// console.log(recommendedCityArray[i])
					try{
						// console.log(bedroomArray[i]["fields"]["Match Groupings"])
						var floorAreaSplitArray = floorAreaArray[i]["fields"]["Match Groupings"].split('-')
						if(parseInt(floorAreaSplitArray[0]) <= parseInt(floormin) && parseInt(floorAreaSplitArray[1]) >= parseInt(floormin)){
							recommendedFloorArea = `,AND({Floor Area} >= "${floorAreaSplitArray[0]}", {Floor Area} <= "${floorAreaSplitArray[1]}")`
						}
					} catch(e){
						console.log(`error: ${e}`)
					}
				}
			}
		} else if(isFloorMinEmpty == true && isFloorMaxEmpty == false && td.propertyType != "Residential Condo"){
			const readRes5 = await airTableMatchingCriteria.read({
				filterByFormula: `{Matching Type} = "Floor Area Non-Condo"`,
			})
			var floorAreaArray = readRes5
			if(floorAreaArray.length > 0){
				for (var i = 0; i < floorAreaArray.length; i++) {
					// console.log(recommendedCityArray[i])
					try{
						// console.log(bedroomArray[i]["fields"]["Match Groupings"])
						var floorAreaSplitArray = floorAreaArray[i]["fields"]["Match Groupings"].split('-')
						if(parseInt(floorAreaSplitArray[0]) <= parseInt(floormax) && parseInt(floorAreaSplitArray[1]) >= parseInt(floormax)){
							recommendedFloorArea = `,AND({Floor Area} >= "${floorAreaSplitArray[0]}", {Floor Area} <= "${floorAreaSplitArray[1]}")`
						}
					} catch(e){
						console.log(`error: ${e}`)
					}
				}
			}
		}

		// lot area
		if(isLotMinEmpty == false && isLotMaxEmpty == false){
			const readRes6 = await airTableMatchingCriteria.read({
				filterByFormula: `{Matching Type} = "Lot Area"`,
			})
			var lotAreaArray = readRes6
			if(lotAreaArray.length > 0){
				for (var i = 0; i < lotAreaArray.length; i++) {
					// console.log(recommendedCityArray[i])
					try{
						// console.log(bedroomArray[i]["fields"]["Match Groupings"])
						var lotAreaSplitArray = lotAreaArray[i]["fields"]["Match Groupings"].split('-')
						if(parseInt(lotAreaArraySplitArray[0]) <= parseInt(lotmin) && parseInt(floorAreaSplitArray[1]) >= parseInt(lotmax)){
							recommendedLotArea = `,AND({Lot Area} >= "${lotAreaArraySplitArray[0]}", {Lot Area} <= "${lotAreaArraySplitArray[1]}")`
						}
					} catch(e){
						console.log(`error: ${e}`)
					}
				}
			}
		} else if(isLotMinEmpty == false && isLotMaxEmpty == true){
			const readRes6 = await airTableMatchingCriteria.read({
				filterByFormula: `{Matching Type} = "Lot Area"`,
			})
			var lotAreaArray = readRes6
			if(lotAreaArray.length > 0){
				for (var i = 0; i < lotAreaArray.length; i++) {
					// console.log(recommendedCityArray[i])
					try{
						// console.log(bedroomArray[i]["fields"]["Match Groupings"])
						var lotAreaSplitArray = lotAreaArray[i]["fields"]["Match Groupings"].split('-')
						if(parseInt(lotAreaSplitArray[0]) <= parseInt(lotmin) && parseInt(lotAreaSplitArray[1]) >= parseInt(lotmin)){
							recommendedLotArea = `,AND({Lot Area} >= "${lotAreaSplitArray[0]}", {Lot Area} <= "${lotAreaSplitArray[1]}")`
						}
					} catch(e){
						console.log(`error: ${e}`)
					}
				}
			}
		} else if(isLotMinEmpty == true && isLotMaxEmpty == false){
			const readRes6 = await airTableMatchingCriteria.read({
				filterByFormula: `{Matching Type} = "Lot Area"`,
			})
			var lotAreaArray = readRes6
			if(lotAreaArray.length > 0){
				for (var i = 0; i < lotAreaArray.length; i++) {
					// console.log(recommendedCityArray[i])
					try{
						// console.log(bedroomArray[i]["fields"]["Match Groupings"])
						var lotAreaSplitArray = lotAreaArray[i]["fields"]["Match Groupings"].split('-')
						if(parseInt(lotAreaSplitArray[0]) <= parseInt(lotmax) && parseInt(lotAreaSplitArray[1]) >= parseInt(lotmax)){
							lotAreaSplitArray = `,AND({Lot Area} >= "${lotAreaSplitArray[0]}", {Lot Area} <= "${lotAreaSplitArray[1]}")`
						}
					} catch(e){
						console.log(`error: ${e}`)
					}
				}
			}
		}

		// location name
		if(condo){
			const readRes7 = await airTableMatchingCriteria.read({
				filterByFormula: `{Matching Type} = "Location Name"`,
			})
			// console.log(`readRes7: ${JSON.parse(readRes7)}`)
			console.log(`readRes7: ${JSON.stringify(readRes7)}`)
			// var exclusionArray = readRes7[0]["fields"]["Match Groupings"].split(',')
			// recommendedLocationName = `SEARCH("${condo}", LOWER(SUBSTITUTE({Location Name}, " ", ""))),`
		}
		

		recommendedMatchesFormula += recommendedPropertyPurpose + recommendedRegion + 
		recommendedPropertyType + recommendedCity + recommendedBedrooms + recommendedFloorArea +
		recommendedLotArea + recommendedLocationName + `)`;
		console.log(`formula ${recommendedMatchesFormula}`)

		const updateRes4 = await airTableSearch.updateWhere(`{Inquiry Code} = "${inquiryCode}"`, {
			"Recommended Formula": recommendedMatchesFormula, "Recommended Inquiry": inquiryMatches
		});

		const recommendedRes = await airTableInquire.read({
			filterByFormula: recommendedMatchesFormula,
		})

		var newRecommendedRes = recommendedRes
		console.log(`recommendedRes: ${JSON.stringify(newRecommendedRes)}`)
		console.log(`recommendedRes: ${newRecommendedRes.length}`)
		for (var i = 0; i < newRecommendedRes.length; i++) {
			var image1 = "";
			var image2 = "";
			var image3 = "";
			var image4 = "";
			var image5 = "";

			if(newRecommendedRes[i]["fields"]["Property Image1"]){
				image1 = newRecommendedRes[i]["fields"]["Property Image1"][0]["url"]
			}
			if(newRecommendedRes[i]["fields"]["Property Image2"]){
				image2 = newRecommendedRes[i]["fields"]["Property Image2"][0]["url"]
			}
			if(newRecommendedRes[i]["fields"]["Property Image3"]){
				image3 = newRecommendedRes[i]["fields"]["Property Image3"][0]["url"]
			}
			if(newRecommendedRes[i]["fields"]["Property Image4"]){
				image4 = newRecommendedRes[i]["fields"]["Property Image4"][0]["url"]
			}
			if(newRecommendedRes[i]["fields"]["Property Image5"]){
				image5 = newRecommendedRes[i]["fields"]["Property Image5"][0]["url"]
			}

			const query = await airTablePRC.read({
				filterByFormula: `{Viber ID} = "${newRecommendedRes[i]["fields"]["Viber ID"]}"`
			});

			const query2 = await airTableHLURB.read({
				filterByFormula: `{Viber ID} = "${newRecommendedRes[i]["fields"]["Viber ID"]}"`
			});

			const query3 = await airTableCredentials.read({
				filterByFormula: `{ID} = "rec23iYg4V4fGnX3C"`
				// filterByFormula: `{ID} = "recq1P9ND0tU7pFjt"`
			});

			var profileSummary
			if(query && query.length != 0){
				profileSummary = query[0].fields["Profile Summary"]
			} else if(query2 && query2.length != 0){
				profileSummary = query2[0].fields["Profile Summary"]
			} else {
				profileSummary = query3[0].fields["Summary"]	
			}


			const fields = {
				"Name": newRecommendedRes[i]["fields"]["Name"],
				"Property Relation": newRecommendedRes[i]["fields"]["Property Relation"],
				"Property Purpose": newRecommendedRes[i]["fields"]["Property Purpose"],
				"Property Type": newRecommendedRes[i]["fields"]["Property Type"],
				"Commercial Type": newRecommendedRes[i]["fields"]["Commercial Type"],
				"Location": (newRecommendedRes[i]["fields"]["Location"]).toUpperCase(),
				"City/Town": (newRecommendedRes[i]["fields"]["City/Town"]).toUpperCase(),
				"Baranggay": (newRecommendedRes[i]["fields"]["Baranggay"]).toUpperCase(),
				"Region/State": (newRecommendedRes[i]["fields"]["Region/State"]).toUpperCase(),
				"Location Name": newRecommendedRes[i]["fields"]["Location Name"],
				"Number of Rooms": parseInt(newRecommendedRes[i]["fields"]["Number of Rooms"]),
				"Floor Area": parseFloat(newRecommendedRes[i]["fields"]["Floor Area"]),
				"Lot Area": parseFloat(newRecommendedRes[i]["fields"]["Lot Area"]),
				"Furnishing": newRecommendedRes[i]["fields"]["Furnishing"],
				"Parking Slots": newRecommendedRes[i]["fields"]["Parking Slots"],
				"Price": parseFloat(newRecommendedRes[i]["fields"]["Price"]),
				"Property Image1": [{"url": image1}],
				"Property Image2": [{"url": image2}],
				"Property Image3": [{"url": image3}],
				"Property Image4": [{"url": image4}],
				"Property Image5": [{"url": image5}],
				"Property Detail": newRecommendedRes[i]["fields"]["Property Detail"],
				"Group Type": newRecommendedRes[i]["fields"]["Group Type"],
				"Sub Group": newRecommendedRes[i]["fields"]["Sub Group"],
				"Commission Rate": newRecommendedRes[i]["fields"]["Commission Rate"],
				"Viber ID": newRecommendedRes[i]["fields"]["Viber ID"],
				"Validated": "1",
				"Broadcasted": "0",
				"Profile Summary": profileSummary,
				"Requester Viber Id": message.trackingData.userid,
				"Requester Profile Summary": requesterProfileSummary,
				"Requester Formula": recommendedMatchesFormula,
				"Inquiry": inquiryMatches,
				"Inquiry Code": inquiryCode,
				"Enlisting Code": newRecommendedRes[i]["fields"]["Enlisting Code"]
			};

			recommendedBase('Recommended Matches').create([
			{
				"fields": fields
			}], function(err, records) {
				if (err) {
					console.error(err);
					return;
				}
			});
			// console.log(`name ${newRecommendedRes[0]["fields"]["Name"]}`)
		}
	}
}

async function updateProofOfPayment(message,url){
	try {
		// const updateRes = await airTableUsers.updateWhere(`{Viber ID} = "${viberId}"`, {
		// 	// Validated: "Yes"
		// 	"Proof of Payment": [{
		// 		"url": url 
		// 	}]
		// });
		// return

		const fields = {
			"Name": message.trackingData.nameReg,
			"Viber ID": message.trackingData.userid,
			"Proof of Payment": [{
				"url": url
			}],
			"Bot": botName + " BOT"
		};
			
		base('Proof of Payment').create([
		{
			"fields": fields
		}], function(err, records) {
			if (err) {
				console.error(err);
				return;
			}
			
		});
	} catch (e) {
		console.log(`error uploading proof of payment ${e}`)
	}
}

async function getMySubscription(message,response,td){
	const mySubscriptionKb = {
		"Type": "keyboard",
		"InputFieldState": "hidden",
		"Buttons": [{
			"Columns": 6,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>I want to submit my proof of payment</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Submit Proof",
			"BgColor": "#c7b0e6",
		}, {
			"Columns": 6,
			"Rows": 1,
			"Text": "<font color=\"#000000\"><b>Go Back To Main Menu</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"TextSize": "medium",
			"ActionBody": "CANCEL2",
			"BgColor": "#FFAA88",
		}]
	};

	td.statusid = "submitProof"
	const readRes2 = await airTableUsers.read({
		filterByFormula: `{Viber ID} = "${message.trackingData.userid}"`
	})

	var subscribedUntil = new Date(Date.parse(readRes2[0].fields["Subscribed Until"]));
	if(subscribedUntil){
		response.send(new TextMessage(`You're subscribed until: ${subscribedUntil}`))	
	} else {
		response.send(new TextMessage(`You are currently not subscribed`))
	}
	response.send(new TextMessage("Please select a service for your subscription ", mySubscriptionKb,null,null,null,4),td);
}

async function setBroadcastPreference(message,response,td){
	const mySubscriptionKb = {
		"Type": "keyboard",
		"InputFieldState": "hidden",
		"Buttons": [{
			"Columns": 6,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>I want to submit my proof of payment</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Submit Proof",
			"BgColor": "#c7b0e6",
		}, {
			"Columns": 6,
			"Rows": 1,
			"Text": "<font color=\"#000000\"><b>Go Back To Main Menu</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"TextSize": "medium",
			"ActionBody": "CANCEL2",
			"BgColor": "#FFAA88",
		}]
	};

	td.statusid = "setBroadcastPreference"
	const readRes2 = await airTableUsers.read({
		filterByFormula: `{Viber ID} = "${message.trackingData.userid}"`
	})

	var subscribedUntil = new Date(Date.parse(readRes2[0].fields["Subscribed Until"]));
	if(subscribedUntil){
		response.send(new TextMessage(`You're subscribed until: ${subscribedUntil}`))	
	} else {
		response.send(new TextMessage(`You are currently not subscribed`))
	}
	response.send(new TextMessage("Please select a service for your subscription ", mySubscriptionKb,null,null,null,4),td);
}

async function checkIfSubscribed(message,response,td){
	const readRes = await airTableUsers.read({
		filterByFormula: `{VIBER ID} = "${message.trackingData.userid}"`
	});

	var subscribed = 0
	if(readRes[0]["fields"]["Subscribed"]){
		subscribed = readRes[0]["fields"]["Subscribed"]
	}
	
	var matchesKb = {
		"Type": "keyboard",
		"InputFieldState": "hidden",
		"Buttons": [{
			"Text": "<b><font color=\"#000000\">BACK TO MAIN MENU</font></b>",
			"ActionType": "reply",
			"ActionBody": "CANCEL2",
			"BgColor": "#FFAA88",
			"TextOpacity": 100,
			"Rows": 1,
			"Columns": 6
		}]
	};

	if(subscribed == "1"){
		matchesKb = {
			"Type": "keyboard",
			"InputFieldState": "hidden",
			"Buttons": [
				{
				"Columns": 3,
				"Rows": 2,
				"Text": "<font color=\"#494E67\"><b>Exact Matches</b></font>",
				"TextSize": "medium",
				"TextHAlign": "center",
				"TextVAlign": "middle",
				"ActionType": "reply",
				"ActionBody": "Exact Matches",
				"BgColor": "#edbf80",
			}, {
				"Columns": 3,
				"Rows": 2,
				"Text": "<font color=\"#494E67\"><b>Recommended Matches</b></font>",
				"TextSize": "medium",
				"TextHAlign": "center",
				"TextVAlign": "middle",
				"ActionType": "reply",
				"ActionBody": "Recommended Matches",
				"BgColor": "#c7b0e6",
			}, {
				"Text": "<b><font color=\"#000000\">BACK TO MAIN MENU</font></b>",
				"ActionType": "reply",
				"ActionBody": "CANCEL2",
				"BgColor": "#FFAA88",
				"TextOpacity": 100,
				"Rows": 1,
				"Columns": 6
			}]
		};
		 
		td.statusid = "selectMatches";
		response.send(new TextMessage("Please select type of matches", matchesKb),td);
	} else {
		td.statusid = "selectMatches";
		response.send(new TextMessage("You don't have active subscription, please go to my susbcription to know more", matchesKb),td);
	}
}

async function getExactMatches(message,response,td){
	var readRes = await airTableExact.read({
		filterByFormula: `OR({Requester Viber Id} = "${message.trackingData.userid}", {Viber ID} = "${message.trackingData.userid}")`,
		// filterByFormula: `AND({Supervisor PRC} = "${readRes[0].fields["PRC Number"]}", {Validated} = "Yes")`,
		sort: [{field: "Requester Formula", direction: "asc"}],
	});

	// readRes = removeDuplicates(readRes)

	inquirePayload[message.trackingData.userid] = readRes
	
	const kb = {
		"Type": "keyboard",
		"InputFieldState": "hidden",
		"Buttons": [{
			"Text": "<b><font color=\"#000000\">Go Back to Main Menu</font></b>",
			"ActionType": "reply",
			"ActionBody": "CANCEL2",
			"BgColor": "#FFAA88",
			"TextOpacity": 100,
			"Rows": 1,
			"Columns": 6
		}]	
	};

	let num = 0;
	let number = 0;
	let action = [];
	let msgArray = [];
	msgArray.push(new TextMessage("These are your matched properties for your searches."));
	for(payload of inquirePayload[message.trackingData.userid]){
		action[num] = {
			//"Property" : num+1,
			//"Property ID": payload.fields["Suggested Property ID"],
			//"Property Summary": payload.fields["Result Header"],
			"Transaction" : payload.fields["Property Purpose"],
			"Property Type" : payload.fields["Property Type"],
			//"Condo/Area/Building Name": payload.fields['Location Name'],
			//"Location" : payload.fields['Location']
		}

		if(payload.fields["Property Type"] == "Commercial with Improvements"){
			action[num]["Commercial Type"] = payload.fields['Commercial Type'];
		}

		action[num]["Location"] = payload.fields['Location'];

		switch (payload.fields["Property Type"]) {
			case "Residential Condo":
				action[num]["Condo Name"] = payload.fields['Location Name'];
				break;
			case "Office Space":
				action[num]["Building Name"] = payload.fields['Location Name'];	
				break; 
			case "Commercial with Improvements": 
				action[num]["Building Name/Area"] = payload.fields['Location Name'];
				break;
			case "Residential House & Lot":
				action[num]["Village/Area"] = payload.fields['Location Name'];
				break;
			case "Industrial with Improvements":
				action[num]["Industrial Park/Area"] = payload.fields['Location Name'];	
				break;
			case "Residential Vacant Lot":
				action[num]["Village/Area"] = payload.fields['Location Name'];
				break;
			case "Commercial Vacant Lot":
				action[num]["Area"] = payload.fields['Location Name'];
				break; 
			case "Industrial Vacant Lot":
				action[num]["Industrial Park/Area"] = payload.fields['Location Name'];
				break;
			case "Raw Land":
				action[num]["Area"] = payload.fields['Location Name'];
				break;
		}


		if(payload.fields['Number of Rooms'] && payload.fields['Number of Rooms'] != 0){
			action[num]["Number of Rooms"] = payload.fields['Number of Rooms'];
		}

		if(payload.fields.Furnishing){
			action[num]["Furnishing"] = payload.fields['Furnishing'];
		}
		if(payload.fields['Lot Area'] && payload.fields['Lot Area'] != 0){
			action[num]["Lot Area"] = payload.fields['Lot Area'] + " sqm";
		}
		if(payload.fields['Floor Area'] && payload.fields['Floor Area'] != 0){
			action[num]["Floor Area"] = payload.fields['Floor Area'] + " sqm";
		}
		if(payload.fields['Parking Slots']){
			action[num]["Parking Slots"] = payload.fields['Parking Slots'];
		}
		
		action[num]["Price"] = payload.fields['Price2'];
		
		if(payload.fields['Property Detail']){
			action[num]["Property Detail"] = payload.fields['Property Detail'];
		}
		
		
		///
		action[num]["Viber ID"] = payload.fields['Viber ID'];
		action[num]["Sub Group"] = payload.fields['Sub Group'];
		action[num]["Suggested"] = payload.fields['Suggested'];
		action[num]["Suggested Client"] = payload.fields['Suggested Client'];
		///
		
		action[num]["Images"] = []
		if (payload.fields['Property Image1']) {
			action[num]["Images"].push(payload.fields['Property Image1']);
		}
		if (payload.fields['Property Image2']) {
			action[num]["Images"].push(payload.fields['Property Image2']);
		}
		if (payload.fields['Property Image3']) {
			action[num]["Images"].push(payload.fields['Property Image3']);
		}
		if (payload.fields['Property Image4']) {
			action[num]["Images"].push(payload.fields['Property Image4']);
		}
		if (payload.fields['Property Image5']) {
			action[num]["Images"].push(payload.fields['Property Image5']);
		}
		
		action[num]["Property ID"] = payload.fields["Suggested Property ID"];
		action[num]["Inquiry"] = payload.fields["Inquiry"]
		action[num]["Requester Profile Summary"] = payload.fields["Requester Profile Summary"]
		num = num + 1;
	}
	

	let richView = {
		"ButtonsGroupColumns": 6,
		"ButtonsGroupRows": 7,
		"BgColor": "#FFFFFF",
		"Buttons": []
	};
	let attach3 = {};
	let attach2 = {};
	//let attach = {};
	let textUri = "";
	let counter = 0;
	console.log(action)
	let summary = "";
	if(td.groupType == "Broker"){
		summary = "Suggested"
	}else{
		summary = "Suggested Client"
	}
	let text = "";
	let arrayer = [];
	let textSummary = "";
	(async () => {
	for(values of action){
		
		number = number + 1;
		counter = counter + 1;
		
		/*
		attach = {
			"ActionBody": "none",
			"Text": "Property " + counter,
			"Silent": "true",
			"Rows": 1,
			"Columns": 6
		}
		richView.Buttons.push(attach);
		*/

		
		if(values["Sub Group"] == "Client" || values["Sub Group"] == "Admin"){
			////////
			try {
				//text = "Dee Chan, PRC 19147 \n09171727788; chan@gmail.com"

				const query = await airTableCredentials.read({
					// filterByFormula: `{ID} = "recq1P9ND0tU7pFjt"`
					filterByFormula: `{ID} = "rec23iYg4V4fGnX3C"`
				});
				text = query[0].fields["Summary"]
				// console.log("pumasok sa if client" + text)
				// delete values["Sub Group"]
				// delete values["Viber ID"]
				// textSummary = values[summary]
				// values["Contact Information"] = text

				// // for two-way matches
				// if(values["Viber ID"] == message.trackingData.userid){
				// 	textSummary = values["Inquiry"]
				// }

				// delete values["Suggested"]
				// delete values["Suggested Client"]
				// delete values["Inquiry"]

				delete values["Sub Group"]
				textSummary = values[summary]
				if(values["Sub Group"] == "Client"){
					delete values["Contact Information"]
				}else{
					values["Contact Information"] = text
				}	
				

				// for two-way matches
				if(values["Viber ID"] == message.trackingData.userid){
					textSummary = values["Inquiry"]
					values["Contact Information"] = values["Requester Profile Summary"]
					text = values["Requester Profile Summary"]
				}

				delete values["Viber ID"]
				delete values["Suggested"]
				delete values["Suggested Client"]
				delete values["Inquiry"]
				delete values["Requester Profile Summary"]

				arrayer = [values];
				textUri = `proptechph.com/display.html?payload=` + encodeURIComponent(JSON.stringify(arrayer));
				attach2 = {
					"ActionBody": textUri,
					"Text": textSummary.replace(/\n/g, "<br>"),
					"ActionType": "open-url",
					"OpenURLType": "internal",
					"Silent": "true",
					//"TextShouldFit": "true",
					"TextSize" : "small",
					"TextHAlign": "left",
					"TextVAlign": "top",
					"Rows": 5,
					"Columns": 6
				}
				richView.Buttons.push(attach2);		
				attach3 = {
					"ActionBody": "none",
					"Text": text,
					"Silent": "true",
					//"TextShouldFit": "true",
					"TextSize" : "small",
					"TextHAlign": "left",
					"BgColor": "#C1E7E3",
					"Rows": 2,
					"Columns": 6
				}
				richView.Buttons.push(attach3);
			} catch (error) {
				console.error(error)
			}


		} else if(values["Sub Group"] == "HLURB"){
			try {
				const query = await airTableHLURB.read({
					filterByFormula: `{Viber ID} = "${values["Viber ID"]}"`
				});
				text = query[0].fields["Profile Summary"]
				
				const query2 = await airTableCredentials.read({
					filterByFormula: `{ID} = "recq1P9ND0tU7pFjt"`
				});

				if(query.length != 0){
					text = query[0].fields["Profile Summary"]
				} else {
					text = query2[0].fields["Summary"]
				}
				// delete values["Sub Group"]
				// delete values["Viber ID"]
				// textSummary = values[summary]

				// // for two-way matches
				// if(values["Viber ID"] == message.trackingData.userid){
				// 	textSummary = values["Inquiry"]
				// }

				// delete values["Suggested"]
				// delete values["Suggested Client"]
				
				// values["Contact Information"] = text

				delete values["Sub Group"]
				textSummary = values[summary]
				values["Contact Information"] = text

				// for two-way matches
				if(values["Viber ID"] == message.trackingData.userid){
					textSummary = values["Inquiry"]
					values["Contact Information"] = values["Requester Profile Summary"]
					text = values["Requester Profile Summary"]
				}

				delete values["Viber ID"]
				delete values["Suggested"]
				delete values["Suggested Client"]
				delete values["Inquiry"]
				delete values["Requester Profile Summary"]

				arrayer = [values];
				textUri = `proptechph.com/display.html?payload=` + encodeURIComponent(JSON.stringify(arrayer));
				attach2 = {
					"ActionBody": textUri,
					"Text": textSummary.replace(/\n/g, "<br>"),
					"ActionType": "open-url",
					"OpenURLType": "internal",
					"Silent": "true",
					"TextSize" : "small",
					//"TextShouldFit": "true",
					"TextHAlign": "left",
					"TextVAlign": "top",
					"Rows": 5,
					"Columns": 6
				}
				richView.Buttons.push(attach2);		
				attach3 = {
					"ActionBody": "none",
					"Text": text,
					"Silent": "true",
					"TextSize" : "small",
					//"TextShouldFit": "true",
					"TextHAlign": "left",
					"BgColor": "#C1E7E3",
					"Rows": 2,
					"Columns": 6
				}
				richView.Buttons.push(attach3);	
			} catch (error) {
				console.error(error)
			}
			
		} else if(values["Sub Group"] == "PRC"){
			try {
				var requesterViberId = JSON.stringify(response.userProfile.id)

				const query1 = await airTableClients.read({
					filterByFormula: `{Viber ID} = ${requesterViberId}`
				});

				const query = await airTablePRC.read({
					filterByFormula: `{Viber ID} = "${values["Viber ID"]}"`
				});
				//text = query[0].fields["Profile Summary"]
				const query2 = await airTableCredentials.read({
					// filterByFormula: `{ID} = "recq1P9ND0tU7pFjt"`
					filterByFormula: `{ID} = "rec23iYg4V4fGnX3C"`
				});
				
				if(query1 && query1.length != 0){
					text = query2[0].fields["Summary"]
				}
				else if(query.length != 0){
					text = query[0].fields["Profile Summary"]
				} else {
					text = query2[0].fields["Summary"]
				}
				
				// delete values["Sub Group"]
				// delete values["Viber ID"]
				// textSummary = values[summary]

				// // for two-way matches
				// if(values["Viber ID"] == message.trackingData.userid){
				// 	textSummary = values["Inquiry"]
				// }

				// delete values["Suggested"]
				// delete values["Suggested Client"]
				// values["Contact Information"] = text

				delete values["Sub Group"]
				textSummary = values[summary]
				values["Contact Information"] = text

				// for two-way matches
				if(values["Viber ID"] == message.trackingData.userid){
					textSummary = values["Inquiry"]
					values["Contact Information"] = values["Requester Profile Summary"]
					text = values["Requester Profile Summary"]
				}

				delete values["Viber ID"]
				delete values["Suggested"]
				delete values["Suggested Client"]
				delete values["Inquiry"]
				delete values["Requester Profile Summary"]

				arrayer = [values];
				textUri = `proptechph.com/display.html?payload=` + encodeURIComponent(JSON.stringify(arrayer));
				attach2 = {
					"ActionBody": textUri,
					"Text": textSummary.replace(/\n/g, "<br>"),
					"ActionType": "open-url",
					"OpenURLType": "internal",
					"Silent": "true",
					"TextSize" : "small",
					//"TextShouldFit": "true",
					"TextHAlign": "left",
					"TextVAlign": "top",
					"Rows": 5,
					"Columns": 6
				}
				richView.Buttons.push(attach2);
				attach3 = {
					"ActionBody": "none",
					"Text": text,
					"Silent": "true",
					"TextSize" : "small",
					//"TextShouldFit": "true",
					"TextHAlign": "left",
					"BgColor": "#C1E7E3",
					"Rows": 2,
					"Columns": 6
				}
				richView.Buttons.push(attach3);	
			} catch (error) {
				console.error(error)
			}
		}

		if(number == 4){
			msgArray.push(new RichMediaMessage(richView))
			richView = {
				"ButtonsGroupColumns": 6,
				"ButtonsGroupRows": 7,
				"BgColor": "#FFFFFF",
				"Buttons": []
			};
			attach = {};
			attach2 = {};
			attach3 = {};
			number = 0;
			text = "";
			arrayer = [];
		} else if (counter == action.length) {
			console.log(richView)
			msgArray.push(new RichMediaMessage(richView))
		}
		
	}
	
	td.statusid = "mainInquireContact"
	// msgArray.push(new TextMessage("End of Listings. "));
	msgArray.push(new TextMessage("End of Listings. ",kb,null,null,null,4));
	// msgArray.push(new TextMessage("These are your matched properties for your searches.",kb,null,null,null,4));
	bot.sendMessage(response.userProfile,msgArray,td);
	})();
}

function removeDuplicates(array) {
  return array.filter((a, b) => array.indexOf(a) === b)
};

async function getRecommendedMatches(message,response,td){
	var readRes = await airTableRecommended.read({
		// filterByFormula: `{Requester Viber Id} = "${message.trackingData.userid}"`
		filterByFormula: `OR({Requester Viber Id} = "${message.trackingData.userid}", {Viber ID} = "${message.trackingData.userid}")`,
		sort: [{field: "Requester Formula", direction: "asc"}],
	});

	// readRes = removeDuplicates(readRes)
	inquirePayload[message.trackingData.userid] = readRes
	
	const kb = {
		"Type": "keyboard",
		"InputFieldState": "hidden",
		"Buttons": [{
			"Text": "<b><font color=\"#000000\">Go Back to Main Menu</font></b>",
			"ActionType": "reply",
			"ActionBody": "CANCEL2",
			"BgColor": "#FFAA88",
			"TextOpacity": 100,
			"Rows": 1,
			"Columns": 6
		}]	
	};

	let num = 0;
	let number = 0;
	let action = [];
	let msgArray = [];
	msgArray.push(new TextMessage("These are your matched properties for your searches."));
	for(payload of inquirePayload[message.trackingData.userid]){
		action[num] = {
			//"Property" : num+1,
			//"Property ID": payload.fields["Suggested Property ID"],
			//"Property Summary": payload.fields["Result Header"],
			"Transaction" : payload.fields["Property Purpose"],
			"Property Type" : payload.fields["Property Type"],
			//"Condo/Area/Building Name": payload.fields['Location Name'],
			//"Location" : payload.fields['Location']
		}

		if(payload.fields["Property Type"] == "Commercial with Improvements"){
			action[num]["Commercial Type"] = payload.fields['Commercial Type'];
		}

		action[num]["Location"] = payload.fields['Location'];

		switch (payload.fields["Property Type"]) {
			case "Residential Condo":
				action[num]["Condo Name"] = payload.fields['Location Name'];
				break;
			case "Office Space":
				action[num]["Building Name"] = payload.fields['Location Name'];	
				break; 
			case "Commercial with Improvements": 
				action[num]["Building Name/Area"] = payload.fields['Location Name'];
				break;
			case "Residential House & Lot":
				action[num]["Village/Area"] = payload.fields['Location Name'];
				break;
			case "Industrial with Improvements":
				action[num]["Industrial Park/Area"] = payload.fields['Location Name'];	
				break;
			case "Residential Vacant Lot":
				action[num]["Village/Area"] = payload.fields['Location Name'];
				break;
			case "Commercial Vacant Lot":
				action[num]["Area"] = payload.fields['Location Name'];
				break; 
			case "Industrial Vacant Lot":
				action[num]["Industrial Park/Area"] = payload.fields['Location Name'];
				break;
			case "Raw Land":
				action[num]["Area"] = payload.fields['Location Name'];
				break;
		}


		if(payload.fields['Number of Rooms'] && payload.fields['Number of Rooms'] != 0){
			action[num]["Number of Rooms"] = payload.fields['Number of Rooms'];
		}

		if(payload.fields.Furnishing){
			action[num]["Furnishing"] = payload.fields['Furnishing'];
		}
		if(payload.fields['Lot Area'] && payload.fields['Lot Area'] != 0){
			action[num]["Lot Area"] = payload.fields['Lot Area'] + " sqm";
		}
		if(payload.fields['Floor Area'] && payload.fields['Floor Area'] != 0){
			action[num]["Floor Area"] = payload.fields['Floor Area'] + " sqm";
		}
		if(payload.fields['Parking Slots']){
			action[num]["Parking Slots"] = payload.fields['Parking Slots'];
		}
		
		action[num]["Price"] = payload.fields['Price2'];
		
		if(payload.fields['Property Detail']){
			action[num]["Property Detail"] = payload.fields['Property Detail'];
		}
		
		
		///
		action[num]["Viber ID"] = payload.fields['Viber ID'];
		action[num]["Sub Group"] = payload.fields['Sub Group'];
		action[num]["Suggested"] = payload.fields['Suggested'];
		action[num]["Suggested Client"] = payload.fields['Suggested Client'];
		///
		
		action[num]["Images"] = []
		if (payload.fields['Property Image1']) {
			action[num]["Images"].push(payload.fields['Property Image1']);
		}
		if (payload.fields['Property Image2']) {
			action[num]["Images"].push(payload.fields['Property Image2']);
		}
		if (payload.fields['Property Image3']) {
			action[num]["Images"].push(payload.fields['Property Image3']);
		}
		if (payload.fields['Property Image4']) {
			action[num]["Images"].push(payload.fields['Property Image4']);
		}
		if (payload.fields['Property Image5']) {
			action[num]["Images"].push(payload.fields['Property Image5']);
		}
		
		action[num]["Property ID"] = payload.fields["Suggested Property ID"];
		action[num]["Inquiry"] = payload.fields["Inquiry"]
		action[num]["Requester Profile Summary"] = payload.fields["Requester Profile Summary"]
		num = num + 1;
	}
	

	let richView = {
		"ButtonsGroupColumns": 6,
		"ButtonsGroupRows": 7,
		"BgColor": "#FFFFFF",
		"Buttons": []
	};
	let attach3 = {};
	let attach2 = {};
	//let attach = {};
	let textUri = "";
	let counter = 0;
	console.log(action)
	let summary = "";
	if(td.groupType == "Broker"){
		summary = "Suggested"
	}else{
		summary = "Suggested Client"
	}
	let text = "";
	let arrayer = [];
	let textSummary = "";
	(async () => {
	for(values of action){
		
		number = number + 1;
		counter = counter + 1;
		
		/*
		attach = {
			"ActionBody": "none",
			"Text": "Property " + counter,
			"Silent": "true",
			"Rows": 1,
			"Columns": 6
		}
		richView.Buttons.push(attach);
		*/

		
		if(values["Sub Group"] == "Client" || values["Sub Group"] == "Admin"){
			////////
			try {
				//text = "Dee Chan, PRC 19147 \n09171727788; chan@gmail.com"

				const query = await airTableCredentials.read({
					// filterByFormula: `{ID} = "recq1P9ND0tU7pFjt"`
					filterByFormula: `{ID} = "rec23iYg4V4fGnX3C"`
				});
				text = query[0].fields["Summary"]
				// console.log("pumasok sa if client" + text)
				// delete values["Sub Group"]
				// delete values["Viber ID"]
				// textSummary = values[summary]

				// // for two-way matches
				// if(values["Viber ID"] == message.trackingData.userid){
				// 	textSummary = values["Inquiry"]
				// }

				// delete values["Suggested"]
				// delete values["Suggested Client"]
				// values["Contact Information"] = text

				delete values["Sub Group"]
				textSummary = values[summary]
				//values["Contact Information"] = text
				if(values["Sub Group"] == "Client"){
					delete values["Contact Information"]
				}else{
					values["Contact Information"] = text
				}	

				// for two-way matches
				if(values["Viber ID"] == message.trackingData.userid){
					textSummary = values["Inquiry"]
					values["Contact Information"] = values["Requester Profile Summary"]
					text = values["Requester Profile Summary"]
				}

				delete values["Viber ID"]
				delete values["Suggested"]
				delete values["Suggested Client"]
				delete values["Inquiry"]
				delete values["Requester Profile Summary"]

				arrayer = [values];
				textUri = `proptechph.com/display.html?payload=` + encodeURIComponent(JSON.stringify(arrayer));
				attach2 = {
					"ActionBody": textUri,
					"Text": textSummary.replace(/\n/g, "<br>"),
					"ActionType": "open-url",
					"OpenURLType": "internal",
					"Silent": "true",
					//"TextShouldFit": "true",
					"TextSize" : "small",
					"TextHAlign": "left",
					"TextVAlign": "top",
					"Rows": 5,
					"Columns": 6
				}
				richView.Buttons.push(attach2);		
				attach3 = {
					"ActionBody": "none",
					"Text": text,
					"Silent": "true",
					//"TextShouldFit": "true",
					"TextSize" : "small",
					"TextHAlign": "left",
					"BgColor": "#C1E7E3",
					"Rows": 2,
					"Columns": 6
				}
				richView.Buttons.push(attach3);
			} catch (error) {
				console.error(error)
			}


		} else if(values["Sub Group"] == "HLURB"){
			try {
				const query = await airTableHLURB.read({
					filterByFormula: `{Viber ID} = "${values["Viber ID"]}"`
				});
				text = query[0].fields["Profile Summary"]
				
				const query2 = await airTableCredentials.read({
					filterByFormula: `{ID} = "recq1P9ND0tU7pFjt"`
				});

				if(query.length != 0){
					text = query[0].fields["Profile Summary"]
				} else {
					text = query2[0].fields["Summary"]
				}
				// delete values["Sub Group"]
				// delete values["Viber ID"]
				// textSummary = values[summary]

				// // for two-way matches
				// if(values["Viber ID"] == message.trackingData.userid){
				// 	textSummary = values["Inquiry"]
				// }

				// delete values["Suggested"]
				// delete values["Suggested Client"]
				
				// values["Contact Information"] = text

				delete values["Sub Group"]
				textSummary = values[summary]
				values["Contact Information"] = text

				// for two-way matches
				if(values["Viber ID"] == message.trackingData.userid){
					textSummary = values["Inquiry"]
					values["Contact Information"] = values["Requester Profile Summary"]
					text = values["Requester Profile Summary"]
				}

				delete values["Viber ID"]
				delete values["Suggested"]
				delete values["Suggested Client"]
				delete values["Inquiry"]
				delete values["Requester Profile Summary"]

				arrayer = [values];
				textUri = `proptechph.com/display.html?payload=` + encodeURIComponent(JSON.stringify(arrayer));
				attach2 = {
					"ActionBody": textUri,
					"Text": textSummary.replace(/\n/g, "<br>"),
					"ActionType": "open-url",
					"OpenURLType": "internal",
					"Silent": "true",
					"TextSize" : "small",
					//"TextShouldFit": "true",
					"TextHAlign": "left",
					"TextVAlign": "top",
					"Rows": 5,
					"Columns": 6
				}
				richView.Buttons.push(attach2);		
				attach3 = {
					"ActionBody": "none",
					"Text": text,
					"Silent": "true",
					"TextSize" : "small",
					//"TextShouldFit": "true",
					"TextHAlign": "left",
					"BgColor": "#C1E7E3",
					"Rows": 2,
					"Columns": 6
				}
				richView.Buttons.push(attach3);	
			} catch (error) {
				console.error(error)
			}
			
		} else if(values["Sub Group"] == "PRC"){
			try {
				var requesterViberId = JSON.stringify(response.userProfile.id)

				const query1 = await airTableClients.read({
					filterByFormula: `{Viber ID} = ${requesterViberId}`
				});

				const query = await airTablePRC.read({
					filterByFormula: `{Viber ID} = "${values["Viber ID"]}"`
				});
				//text = query[0].fields["Profile Summary"]
				const query2 = await airTableCredentials.read({
					// filterByFormula: `{ID} = "recq1P9ND0tU7pFjt"`
					filterByFormula: `{ID} = "rec23iYg4V4fGnX3C"`
				});
				
				if(query1 && query1.length != 0){
					text = query2[0].fields["Summary"]
				}
				else if(query.length != 0){
					text = query[0].fields["Profile Summary"]
				} else {
					text = query2[0].fields["Summary"]
				}
				
				delete values["Sub Group"]
				textSummary = values[summary]
				values["Contact Information"] = text

				// for two-way matches
				if(values["Viber ID"] == message.trackingData.userid){
					textSummary = values["Inquiry"]
					values["Contact Information"] = values["Requester Profile Summary"]
					text = values["Requester Profile Summary"]
				}

				delete values["Viber ID"]
				delete values["Suggested"]
				delete values["Suggested Client"]
				delete values["Inquiry"]
				delete values["Requester Profile Summary"]
				
				arrayer = [values];
				textUri = `proptechph.com/display.html?payload=` + encodeURIComponent(JSON.stringify(arrayer));
				attach2 = {
					"ActionBody": textUri,
					"Text": textSummary.replace(/\n/g, "<br>"),
					"ActionType": "open-url",
					"OpenURLType": "internal",
					"Silent": "true",
					"TextSize" : "small",
					//"TextShouldFit": "true",
					"TextHAlign": "left",
					"TextVAlign": "top",
					"Rows": 5,
					"Columns": 6
				}
				richView.Buttons.push(attach2);
				attach3 = {
					"ActionBody": "none",
					"Text": text,
					"Silent": "true",
					"TextSize" : "small",
					//"TextShouldFit": "true",
					"TextHAlign": "left",
					"BgColor": "#C1E7E3",
					"Rows": 2,
					"Columns": 6
				}
				richView.Buttons.push(attach3);	
			} catch (error) {
				console.error(error)
			}
		}

		if(number == 4){
			msgArray.push(new RichMediaMessage(richView))
			richView = {
				"ButtonsGroupColumns": 6,
				"ButtonsGroupRows": 7,
				"BgColor": "#FFFFFF",
				"Buttons": []
			};
			attach = {};
			attach2 = {};
			attach3 = {};
			number = 0;
			text = "";
			arrayer = [];
		} else if (counter == action.length) {
			// msgArray.push(new TextMessage("These are your matched properties for your searches.",kb,null,null,null,4));
			console.log(richView)
			msgArray.push(new RichMediaMessage(richView))
		}
		
	}
	
	td.statusid = "mainInquireContact"
	msgArray.push(new TextMessage("End of Listings. ",kb,null,null,null,4));
	// msgArray.push(new TextMessage("These are your matched properties for your searches.",kb,null,null,null,4));
	bot.sendMessage(response.userProfile,msgArray,td);
	})();
}



//////////////////////////////////////
// END MAIN INQUIRE Functions ////////
//////////////////////////////////////



// for matching assistant and my subscription kb

const account2Kb ={
	"Type": "keyboard",
	"InputFieldState": "hidden",
	"Buttons": [{
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>My FS/FL</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Submissions",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>My WTB/WTL</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Saved Search",
		"BgColor": "#c7b0e6",
	},
	//  { 
	// 	"Columns": 3,
	// 	"Rows": 1,
	// 	"Text": "<font color=\"#494E67\"><b>Matching Assistant</b></font>",
	// 	"TextSize": "medium",
	// 	"TextHAlign": "center",
	// 	"TextVAlign": "middle",
	// 	"ActionType": "reply",
	// 	"ActionBody": "Matching Assistant",
	// 	"BgColor": "#c7b0e6",
	// }, 
	// { 
	// 	"Columns": 3,
	// 	"Rows": 1,
	// 	"Text": "<font color=\"#494E67\"><b>My Subscription</b></font>",
	// 	"TextSize": "medium",
	// 	"TextHAlign": "center",
	// 	"TextVAlign": "middle",
	// 	"ActionType": "reply",
	// 	"ActionBody": "My Subscription",
	// 	"BgColor": "#edbf80",
	// },
	 {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>My Salespersons</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Salesperson",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Register Again</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Delete",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>About US</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "open-url",
		"TextSize": "medium",
		"ActionBody": "https://nrealistings.com/about-nrea",
		"OpenURLType": "internal",
		"Silent": "true",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>FAQ</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "open-url",
		"TextSize": "medium",
		"ActionBody": "https://www.nrealistings.com/faq",
		"OpenURLType": "internal",
		"Silent": "true",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Drop a Feedback</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Feedback",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Broadcast Preference</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Broadcast Preference",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#000000\"><b>Go Back To Main Menu</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"TextSize": "medium",
		"ActionBody": "CANCEL2",
		"BgColor": "#FFAA88",
	}]
};

const account3Kb ={
	"Type": "keyboard",
	"InputFieldState": "hidden",
	"Buttons": [{
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>My FS/FL</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Submissions",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>My WTB/WTL</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Saved Search",
		"BgColor": "#c7b0e6",
	}, 
	// { 
	// 	"Columns": 3,
	// 	"Rows": 1,
	// 	"Text": "<font color=\"#494E67\"><b>Matching Assistant</b></font>",
	// 	"TextSize": "medium",
	// 	"TextHAlign": "center",
	// 	"TextVAlign": "middle",
	// 	"ActionType": "reply",
	// 	"ActionBody": "Matching Assistant",
	// 	"BgColor": "#c7b0e6",
	// }, 
	// { 
	// 	"Columns": 3,
	// 	"Rows": 1,
	// 	"Text": "<font color=\"#494E67\"><b>My Subscription</b></font>",
	// 	"TextSize": "medium",
	// 	"TextHAlign": "center",
	// 	"TextVAlign": "middle",
	// 	"ActionType": "reply",
	// 	"ActionBody": "My Subscription",
	// 	"BgColor": "#edbf80",
	// }, 
	{
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>My Salespersons</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Salesperson",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Register Again</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Delete",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>About US</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "open-url",
		"TextSize": "medium",
		"ActionBody": "https://nrealistings.com/about-nrea",
		"OpenURLType": "internal",
		"Silent": "true",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>FAQ</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "open-url",
		"TextSize": "medium",
		"ActionBody": "https://www.nrealistings.com/faq",
		"OpenURLType": "internal",
		"Silent": "true",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Drop a Feedback</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Feedback",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Get Matches</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "GetMatches",
		"BgColor": "#c7b0e6",
	// }, {
	// 	"Columns": 3,
	// 	"Rows": 1,
	// 	"Text": "<font color=\"#000000\"><b>Go Back To Main Menu</b></font>",
	// 	"TextSize": "medium",
	// 	"TextHAlign": "center",
	// 	"TextVAlign": "middle",
	// 	"ActionType": "reply",
	// 	"TextSize": "medium",
	// 	"ActionBody": "CANCEL2",
	// 	"BgColor": "#FFAA88",
	// }]
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Broadcast Preference</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Broadcast Preference",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#000000\"><b>Go Back To Main Menu</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"TextSize": "medium",
		"ActionBody": "CANCEL2",
		"BgColor": "#FFAA88",
	}]
};

const account4Kb ={
	"Type": "keyboard",
	"InputFieldState": "hidden",
	"Buttons": [{
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>My FS/FL</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Submissions",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>My WTB/WTL</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Saved Search",
		"BgColor": "#c7b0e6",
	},
	//  { 
	// 	"Columns": 3,
	// 	"Rows": 1,
	// 	"Text": "<font color=\"#494E67\"><b>Matching Assistant</b></font>",
	// 	"TextSize": "medium",
	// 	"TextHAlign": "center",
	// 	"TextVAlign": "middle",
	// 	"ActionType": "reply",
	// 	"ActionBody": "Matching Assistant",
	// 	"BgColor": "#c7b0e6",
	// }, 
	// { 
	// 	"Columns": 3,
	// 	"Rows": 1,
	// 	"Text": "<font color=\"#494E67\"><b>My Subscription</b></font>",
	// 	"TextSize": "medium",
	// 	"TextHAlign": "center",
	// 	"TextVAlign": "middle",
	// 	"ActionType": "reply",
	// 	"ActionBody": "My Subscription",
	// 	"BgColor": "#edbf80",
	// },
	 {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Register Again</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Delete",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>About US</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "open-url",
		"TextSize": "medium",
		"ActionBody": "https://nrealistings.com/about-nrea",
		"OpenURLType": "internal",
		"Silent": "true",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>FAQ</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "open-url",
		"TextSize": "medium",
		"ActionBody": "https://www.nrealistings.com/faq",
		"OpenURLType": "internal",
		"Silent": "true",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Drop a Feedback</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Feedback",
		"BgColor": "#edbf80",
	}, {
		"Columns": 6,
		"Rows": 1,
		"Text": "<font color=\"#000000\"><b>Go Back To Main Menu</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"TextSize": "medium",
		"ActionBody": "CANCEL2",
		"BgColor": "#FFAA88",
	}]
	// }, {
	// 	"Columns": 3,
	// 	"Rows": 1,
	// 	"Text": "<font color=\"#494E67\"><b>Broadcast Preference</b></font>",
	// 	"TextSize": "medium",
	// 	"TextHAlign": "center",
	// 	"TextVAlign": "middle",
	// 	"ActionType": "reply",
	// 	"ActionBody": "Broadcast Preference",
	// 	"BgColor": "#edbf80",
	// }, {
	// 	"Columns": 3,
	// 	"Rows": 1,
	// 	"Text": "<font color=\"#000000\"><b>Go Back To Main Menu</b></font>",
	// 	"TextSize": "medium",
	// 	"TextHAlign": "center",
	// 	"TextVAlign": "middle",
	// 	"ActionType": "reply",
	// 	"TextSize": "medium",
	// 	"ActionBody": "CANCEL2",
	// 	"BgColor": "#FFAA88",
	// }]
};

function mainAccountStart(message, response){

	(async () => {

		try{

			const readRes = await airTableUsers.read({
				filterByFormula: `{Viber ID} = "${message.trackingData.userid}"`,
			})

			const readRes2 = await airTablePRC.read({
				filterByFormula: `{Viber ID} = "${message.trackingData.userid}"`,
			})
			var portalURL;
			if(readRes[0].fields["Sub Group"] == "PRC"){
				portalURL = readRes2[0].fields["Portal URL"];
				console.log(`portalURL ${portalURL}`)
			}
			

			
			const newAccount2Kb = {
				"Type": "keyboard",
				"InputFieldState": "hidden",
				"Buttons": [{
					"Columns": 3,
					"Rows": 1,
					"Text": "<font color=\"#494E67\"><b>My FS/FL</b></font>",
					"TextSize": "medium",
					"TextHAlign": "center",
					"TextVAlign": "middle",
					"ActionType": "reply",
					"ActionBody": "Submissions",
					"BgColor": "#edbf80",
				}, {
					"Columns": 3,
					"Rows": 1,
					"Text": "<font color=\"#494E67\"><b>nrealistings.com</b></font>",
					"TextSize": "medium",
					"TextHAlign": "center",
					"TextVAlign": "middle",
					"ActionType": "reply",
					"ActionBody": `aeloop`,
					"BgColor": "#c7b0e6",
				}, {
					"Columns": 3,
					"Rows": 1,
					"Text": "<font color=\"#494E67\"><b>My WTB/WTL</b></font>",
					"TextSize": "medium",
					"TextHAlign": "center",
					"TextVAlign": "middle",
					"ActionType": "reply",
					"ActionBody": "Saved Search",
					"BgColor": "#c7b0e6",
				}, 
				// {
				// 	"Columns": 3,
				// 	"Rows": 1,
				// 	"Text": "<font color=\"#494E67\"><b>Project Selling</b></font>",
				// 	"TextSize": "medium",
				// 	"TextHAlign": "center",
				// 	"TextVAlign": "middle",	
				// 	"ActionType": "open-url",
				// 	"TextSize": "medium",
				// 	"ActionBody": "https://airtable.com/shrvbXe6mbNsIRC9b",
				// 	"OpenURLType": "internal",
				// 	"Silent": "true",
				// 	"BgColor": "#edbf80",
				// }, 
				// { 
				// 	"Columns": 3,
				// 	"Rows": 1,
				// 	"Text": "<font color=\"#494E67\"><b>Matching Assistant</b></font>",
				// 	"TextSize": "medium",
				// 	"TextHAlign": "center",
				// 	"TextVAlign": "middle",
				// 	"ActionType": "reply",
				// 	"ActionBody": "Matching Assistant",
				// 	"BgColor": "#edbf80",
				// }, { 
				// 	"Columns": 3,
				// 	"Rows": 1,
				// 	"Text": "<font color=\"#494E67\"><b>My Subscription</b></font>",
				// 	"TextSize": "medium",
				// 	"TextHAlign": "center",
				// 	"TextVAlign": "middle",
				// 	"ActionType": "reply",
				// 	"ActionBody": "My Subscription",
				// 	"BgColor": "#c7b0e6",
				// }, 
				{
					"Columns": 3,
					"Rows": 1,
					"Text": "<font color=\"#494E67\"><b>My Salespersons</b></font>",
					"TextSize": "medium",
					"TextHAlign": "center",
					"TextVAlign": "middle",
					"ActionType": "reply",
					"ActionBody": "Salesperson",
					"BgColor": "#c7b0e6",
				},
/*				 {
					"Columns": 3,
					"Rows": 1,
					"Text": "<font color=\"#494E67\"><b>Confirm Salesperson</b></font>",
					"TextSize": "medium",
					"TextHAlign": "center",
					"TextVAlign": "middle",
					"ActionType": "reply",
					"ActionBody": "Supervision",
					"BgColor": "#edbf80",
				}, {
					"Columns": 3,
					"Rows": 1,
					"Text": "<font color=\"#494E67\"><b>Remove Salesperson</b></font>",
					"TextSize": "medium",
					"TextHAlign": "center",
					"TextVAlign": "middle",
					"ActionType": "reply",
					"ActionBody": "Remove",
					"BgColor": "#c7b0e6",
				}, {
					"Columns": 3,
					"Rows": 1,
					"Text": "<font color=\"#494E67\"><b>Register Again</b></font>",
					"TextSize": "medium",
					"TextHAlign": "center",
					"TextVAlign": "middle",
					"ActionType": "reply",
					"ActionBody": "Delete",
					"BgColor": "#c7b0e6",
				}, */
				{
					"Columns": 3,
					"Rows": 1,
					"Text": "<font color=\"#494E67\"><b>Broadcast Preference</b></font>",
					"TextSize": "medium",
					"TextHAlign": "center",
					"TextVAlign": "middle",
					"ActionType": "reply",
					"ActionBody": "Broadcast Preference",
					"BgColor": "#edbf80",
				}, {
					"Columns": 3,
					"Rows": 1,
					"Text": "<font color=\"#494E67\"><b>FAQ</b></font>",
					"TextSize": "medium",
					"TextHAlign": "center",
					"TextVAlign": "middle",
					"ActionType": "open-url",
					"TextSize": "medium",
					"ActionBody": "https://www.nrealistings.com/faq",
					"OpenURLType": "internal",
					"Silent": "true",
					"BgColor": "#edbf80",
				}, {
					"Columns": 3,
					"Rows": 1,
					"Text": "<font color=\"#494E67\"><b>About US</b></font>",
					"TextSize": "medium",
					"TextHAlign": "center",
					"TextVAlign": "middle",
					"ActionType": "open-url",
					"TextSize": "medium",
					"ActionBody": "https://nrealistings.com/about-nrea",
					"OpenURLType": "internal",
					"Silent": "true",
					"BgColor": "#c7b0e6",
				}, {
					"Columns": 3,
					"Rows": 1,
					"Text": "<font color=\"#494E67\"><b>Drop a Feedback</b></font>",
					"TextSize": "medium",
					"TextHAlign": "center",
					"TextVAlign": "middle",
					"ActionType": "reply",
					"ActionBody": "Feedback",
					"BgColor": "#c7b0e6",
				}, {
					"Columns": 3,
					"Rows": 1,
					"Text": "<font color=\"#000000\"><b>Go Back To Main Menu</b></font>",
					"TextSize": "medium",
					"TextHAlign": "center",
					"TextVAlign": "middle",
					"ActionType": "reply",
					"TextSize": "medium",
					"ActionBody": "CANCEL2",
					"BgColor": "#FFAA88",
				}]
			};
			const newAccount3Kb = {
				"Type": "keyboard",
				"InputFieldState": "hidden",
				"Buttons": [{
					"Columns": 3,
					"Rows": 1,
					"Text": "<font color=\"#494E67\"><b>My FS/FL</b></font>",
					"TextSize": "medium",
					"TextHAlign": "center",
					"TextVAlign": "middle",
					"ActionType": "reply",
					"ActionBody": "Submissions",
					"BgColor": "#edbf80",
				}, {
					"Columns": 3,
					"Rows": 1,
					"Text": "<font color=\"#494E67\"><b>nrealistings.com</b></font>",
					"TextSize": "medium",
					"TextHAlign": "center",
					"TextVAlign": "middle",
					"ActionType": "reply",
					"ActionBody": `aeloop`,
					"BgColor": "#c7b0e6",
				}, {
					"Columns": 3,
					"Rows": 1,
					"Text": "<font color=\"#494E67\"><b>My WTB/WTL</b></font>",
					"TextSize": "medium",
					"TextHAlign": "center",
					"TextVAlign": "middle",
					"ActionType": "reply",
					"ActionBody": "Saved Search",
					"BgColor": "#c7b0e6",
				}, {
					"Columns": 3,
					"Rows": 1,
					"Text": "<font color=\"#494E67\"><b>Project Selling</b></font>",
					"TextSize": "medium",
					"TextHAlign": "center",
					"TextVAlign": "middle",
					"ActionType": "open-url",
					"TextSize": "medium",
					"ActionBody": "https://airtable.com/shrvbXe6mbNsIRC9b",
					"OpenURLType": "internal",
					"Silent": "true",
					"BgColor": "#edbf80",
				},
				//  { 
				// 	"Columns": 3,
				// 	"Rows": 1,
				// 	"Text": "<font color=\"#494E67\"><b>Matching Assistant</b></font>",
				// 	"TextSize": "medium",
				// 	"TextHAlign": "center",
				// 	"TextVAlign": "middle",
				// 	"ActionType": "reply",
				// 	"ActionBody": "Matching Assistant",
				// 	"BgColor": "#edbf80",
				// }, { 
				// 	"Columns": 3,
				// 	"Rows": 1,
				// 	"Text": "<font color=\"#494E67\"><b>My Subscription</b></font>",
				// 	"TextSize": "medium",
				// 	"TextHAlign": "center",
				// 	"TextVAlign": "middle",
				// 	"ActionType": "reply",
				// 	"ActionBody": "My Subscription",
				// 	"BgColor": "#c7b0e6",
				// },
				 {
					"Columns": 3,
					"Rows": 1,
					"Text": "<font color=\"#494E67\"><b>My Salesperson</b></font>",
					"TextSize": "medium",
					"TextHAlign": "center",
					"TextVAlign": "middle",
					"ActionType": "reply",
					"ActionBody": "Salesperson",
					"BgColor": "#c7b0e6",
				},
/*				 {
					"Columns": 3,
					"Rows": 1,
					"Text": "<font color=\"#494E67\"><b>Confirm Salesperson</b></font>",
					"TextSize": "medium",
					"TextHAlign": "center",
					"TextVAlign": "middle",
					"ActionType": "reply",
					"ActionBody": "Supervision",
					"BgColor": "#edbf80",
				}, {
					"Columns": 3,
					"Rows": 1,
					"Text": "<font color=\"#494E67\"><b>Remove Salesperson</b></font>",
					"TextSize": "medium",
					"TextHAlign": "center",
					"TextVAlign": "middle",
					"ActionType": "reply",
					"ActionBody": "Remove",
					"BgColor": "#c7b0e6",
				}, {
					"Columns": 3,
					"Rows": 1,
					"Text": "<font color=\"#494E67\"><b>Register Again</b></font>",
					"TextSize": "medium",
					"TextHAlign": "center",
					"TextVAlign": "middle",
					"ActionType": "reply",
					"ActionBody": "Delete",
					"BgColor": "#c7b0e6",
				}, */
				{
					"Columns": 3,
					"Rows": 1,
					"Text": "<font color=\"#494E67\"><b>Broadcast Preference</b></font>",
					"TextSize": "medium",
					"TextHAlign": "center",
					"TextVAlign": "middle",
					"ActionType": "reply",
					"ActionBody": "Broadcast Preference",
					"BgColor": "#edbf80",
				}, {
					"Columns": 3,
					"Rows": 1,
					"Text": "<font color=\"#494E67\"><b>FAQ</b></font>",
					"TextSize": "medium",
					"TextHAlign": "center",
					"TextVAlign": "middle",
					"ActionType": "open-url",
					"TextSize": "medium",
					"ActionBody": "https://www.nrealistings.com/faq",
					"OpenURLType": "internal",
					"Silent": "true",
					"BgColor": "#edbf80",
				}, {
					"Columns": 3,
					"Rows": 1,
					"Text": "<font color=\"#494E67\"><b>About US</b></font>",
					"TextSize": "medium",
					"TextHAlign": "center",
					"TextVAlign": "middle",
					"ActionType": "open-url",
					"TextSize": "medium",
					"ActionBody": "https://nrealistings.com/about-nrea",
					"OpenURLType": "internal",
					"Silent": "true",
					"BgColor": "#c7b0e6",
				}, {
					"Columns": 3,
					"Rows": 1,
					"Text": "<font color=\"#494E67\"><b>Drop a Feedback</b></font>",
					"TextSize": "medium",
					"TextHAlign": "center",
					"TextVAlign": "middle",
					"ActionType": "reply",
					"ActionBody": "Feedback",
					"BgColor": "#c7b0e6",
				}, {
					"Columns": 3,
					"Rows": 1,
					"Text": "<font color=\"#494E67\"><b>Get Matches</b></font>",
					"TextSize": "medium",
					"TextHAlign": "center",
					"TextVAlign": "middle",
					"ActionType": "reply",
					"ActionBody": "GetMatches",
					"BgColor": "#edbf80",
				}, {
					"Columns": 3,
					"Rows": 1,
					"Text": "<font color=\"#000000\"><b>Go Back To Main Menu</b></font>",
					"TextSize": "medium",
					"TextHAlign": "center",
					"TextVAlign": "middle",
					"ActionType": "reply",
					"TextSize": "medium",
					"ActionBody": "CANCEL2",
					"BgColor": "#FFAA88",
				}]
			};

			const newAccount4Kb = {
				"Type": "keyboard",
				"InputFieldState": "hidden",
				"Buttons": [{
					"Columns": 3,
					"Rows": 1,
					"Text": "<font color=\"#494E67\"><b>My FS/FL</b></font>",
					"TextSize": "medium",
					"TextHAlign": "center",
					"TextVAlign": "middle",
					"ActionType": "reply",
					"ActionBody": "Submissions",
					"BgColor": "#edbf80",
				}, {
					"Columns": 3,
					"Rows": 1,
					"Text": "<font color=\"#494E67\"><b>nrealistings.com</b></font>",
					"TextSize": "medium",
					"TextHAlign": "center",
					"TextVAlign": "middle",
					"ActionType": "reply",
					"ActionBody": `aeloop`,
					"BgColor": "#c7b0e6",
				}, {
					"Columns": 3,
					"Rows": 1,
					"Text": "<font color=\"#494E67\"><b>My WTB/WTL</b></font>",
					"TextSize": "medium",
					"TextHAlign": "center",
					"TextVAlign": "middle",
					"ActionType": "reply",
					"ActionBody": "Saved Search",
					"BgColor": "#c7b0e6",
				}, {
					"Columns": 3,
					"Rows": 1,
					"Text": "<font color=\"#494E67\"><b>Project Selling</b></font>",
					"TextSize": "medium",
					"TextHAlign": "center",
					"TextVAlign": "middle",
					"ActionType": "open-url",
					"TextSize": "medium",
					"ActionBody": "https://airtable.com/shrvbXe6mbNsIRC9b",
					"OpenURLType": "internal",
					"Silent": "true",
					"BgColor": "#edbf80",
				}, 
				// { 
				// 	"Columns": 3,
				// 	"Rows": 1,
				// 	"Text": "<font color=\"#494E67\"><b>Matching Assistant</b></font>",
				// 	"TextSize": "medium",
				// 	"TextHAlign": "center",
				// 	"TextVAlign": "middle",
				// 	"ActionType": "reply",
				// 	"ActionBody": "Matching Assistant",
				// 	"BgColor": "#edbf80",
				// }, { 
				// 	"Columns": 3,
				// 	"Rows": 1,
				// 	"Text": "<font color=\"#494E67\"><b>My Subscription</b></font>",
				// 	"TextSize": "medium",
				// 	"TextHAlign": "center",
				// 	"TextVAlign": "middle",
				// 	"ActionType": "reply",
				// 	"ActionBody": "My Subscription",
				// 	"BgColor": "#c7b0e6",
				// }, 
				{
					"Columns": 3,
					"Rows": 1,
					"Text": "<font color=\"#494E67\"><b>Broadcast Preference</b></font>",
					"TextSize": "medium",
					"TextHAlign": "center",
					"TextVAlign": "middle",
					"ActionType": "reply",
					"ActionBody": "Broadcast Preference",
					"BgColor": "#c7b0e6",
				},
				//  { 
				// 	"Columns": 3,
				// 	"Rows": 1,
				// 	"Text": "<font color=\"#494E67\"><b>My Subscription</b></font>",
				// 	"TextSize": "medium",
				// 	"TextHAlign": "center",
				// 	"TextVAlign": "middle",
				// 	"ActionType": "reply",
				// 	"ActionBody": "My Subscription",
				// 	"BgColor": "#edbf80",
				// },
				 {
					"Columns": 3,
					"Rows": 1,
					"Text": "<font color=\"#494E67\"><b>FAQ</b></font>",
					"TextSize": "medium",
					"TextHAlign": "center",
					"TextVAlign": "middle",
					"ActionType": "open-url",
					"TextSize": "medium",
					"ActionBody": "https://www.nrealistings.com/faq",
					"OpenURLType": "internal",
					"Silent": "true",
					"BgColor": "#edbf80",
				}, {
					"Columns": 3,
					"Rows": 1,
					"Text": "<font color=\"#494E67\"><b>About US</b></font>",
					"TextSize": "medium",
					"TextHAlign": "center",
					"TextVAlign": "middle",
					"ActionType": "open-url",
					"TextSize": "medium",
					"ActionBody": "https://nrealistings.com/about-nrea",
					"OpenURLType": "internal",
					"Silent": "true",
					"BgColor": "#c7b0e6",
				}, {
					"Columns": 3,
					"Rows": 1,
					"Text": "<font color=\"#494E67\"><b>Drop a Feedback</b></font>",
					"TextSize": "medium",
					"TextHAlign": "center",
					"TextVAlign": "middle",
					"ActionType": "reply",
					"ActionBody": "Feedback",
					"BgColor": "#c7b0e6",
				}, {
					"Columns": 3,
					"Rows": 1,
					"Text": "<font color=\"#000000\"><b>Go Back To Main Menu</b></font>",
					"TextSize": "medium",
					"TextHAlign": "center",
					"TextVAlign": "middle",
					"ActionType": "reply",
					"TextSize": "medium",
					"ActionBody": "CANCEL2",
					"BgColor": "#FFAA88",
				}]
			};


			var latestAccount2kb, latestAccount3kb, latestAccount4kb;
			if (readRes[0].fields["Sub Group"] == "Client") {
				latestAccount2kb = account2Kb
				latestAccount3kb = account3Kb
				latestAccount4kb = account4Kb
			} else {
				latestAccount2kb = newAccount2Kb
				latestAccount3kb = newAccount3Kb
				latestAccount4kb = newAccount4Kb
			}

			if(readRes[0].fields["Sub Group"] == "PRC"){
				// response.send(new TextMessage(`I would gladly assist you. What do you wish to see today?`, account3Kb,null,null,null,4),{
				response.send(new TextMessage(`I would gladly assist you. What do you wish to see today?`, latestAccount2kb,null,null,null,4),{					
					statusid: "mainAccountStart",
					nameReg: message.trackingData.nameReg,
					userid: response.userProfile.id,
					groupType: message.trackingData.groupType,
					subGroup: readRes[0].fields["Sub Group"]
				});
			}
			else if(readRes[0].fields["Sub Group"] == "Admin"){
				// response.send(new TextMessage(`I would gladly assist you. What do you wish to see today?`, account3Kb,null,null,null,4),{
				response.send(new TextMessage(`I would gladly assist you. What do you wish to see today?`, latestAccount3kb,null,null,null,4),{					
					statusid: "mainAccountStart",
					nameReg: message.trackingData.nameReg,
					userid: response.userProfile.id,
					groupType: message.trackingData.groupType,
					subGroup: readRes[0].fields["Sub Group"]
				});
			} 
			else if(readRes[0].fields["Sub Group"] == "HLURB") {
				// response.send(new TextMessage(`I would gladly assist you. What do you wish to see today?`, account4Kb,null,null,null,4),{
				response.send(new TextMessage(`I would gladly assist you. What do you wish to see today?`, latestAccount4kb,null,null,null,4),{					
					statusid: "mainAccountStart",
					nameReg: message.trackingData.nameReg,
					userid: response.userProfile.id,
					groupType: message.trackingData.groupType,
					subGroup: readRes[0].fields["Sub Group"]
				});
			}else {
				// response.send(new TextMessage(`I would gladly assist you. What do you wish to see today?`, account2Kb,null,null,null,4),{
				response.send(new TextMessage(`I would gladly assist you. What do you wish to see today?`, latestAccount2kb,null,null,null,4),{
					statusid: "mainAccountStart",
					nameReg: message.trackingData.nameReg,
					userid: response.userProfile.id,
					groupType: message.trackingData.groupType,
					subGroup: readRes[0].fields["Sub Group"]
				});
			}
				
		} catch (e){
			console.error(e)
		}
	})();
	
	

}

function salesperson(message, response){

	const salesKb = {
		"Type": "keyboard",
		"InputFieldState": "hidden",
		"Buttons": [{
			"Columns": 3,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>Confirm Salesperson</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Supervision",
			"BgColor": "#edbf80",
		}, {
			"Columns": 3,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>Remove Salesperson</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"ActionBody": "Remove",
			"BgColor": "#c7b0e6",
		}, {
			"Columns": 6,
			"Rows": 1,
			"Text": "<font color=\"#000000\"><b>Go Back To Main Menu</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"TextSize": "medium",
			"ActionBody": "CANCEL2",
			"BgColor": "#FFAA88",
		}]
	};

	response.send(new TextMessage(`What do you wish to do with the salesperson?`, salesKb,null,null,null,4),message.trackingData);

}
///////////////////////////////////////
// AirTable Functions ////////////////
///////////////////////////////////////

function makeid(length) {
	var result           = '';
	var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var charactersLength = characters.length;
	for ( var i = 0; i < length; i++ ) {
	   result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}


function deleteRecord(table, id) {
	
	base(table).select({
		filterByFormula: `{Viber ID} = "${id}"`,
			
	}).eachPage(function page(records, fetchNextPage) {
		records.forEach(function(record) {
			
			base(table).destroy(record.id, function(err, deletedRecord) {
				if (err) { console.error(err); return;}
				
			  	});
		});
		fetchNextPage();
	}, function done(err) {
			if (err) { console.error(err); return; }
	});
		
	

}



function updateRecords(clientID){
	(async () => {
		try {
			const updateRes3 = await airTableProperties.updateWhere(`{Viber ID} = "${clientID}"`, {
				Validated: "0"
			});
			base('Users').select({
				filterByFormula: `{Viber ID} = "${clientID}"`,
					
			}).eachPage(function page(records, fetchNextPage) {
				records.forEach(function(record) {
						
					switch(record.fields["Sub Group"]) {
						case "PRC":
							  deleteRecord("Brokers (PRC)", clientID);
							  break;
						case "HLURB":
							  deleteRecord("Brokers (HLURB)", clientID);
							  break;
						case "JOIN":
							deleteRecord("Brokers (JOIN)", clientID);
							break;
						default:
							deleteRecord("Clients", clientID);
							break;
					  }
		
				});
				fetchNextPage();
			}, function done(err) {
					if (err) { console.error(err); return; }
			});
			
			deleteRecord("Users", clientID);

		}catch (e){
			console.error(e)
		}
	})();
}

function createUser(message,validated,confirm_code) {
	 
	clientID = message.trackingData.userid;

	const fields = {
		"Name": message.trackingData.nameReg,
		"Group": message.trackingData.groupType,
		"Viber ID": message.trackingData.userid,
		"Sub Group": message.trackingData.subGroup,
		"Validated": validated,
		"Confirm Code": confirm_code
	};
		
	base('Users').create([
	{
		"fields": fields
	}], function(err, records) {
		if (err) {
			console.error(err);
			return;
		}
		
	});

	joined[clientID] = fields;
	
}



function registrationClient(message) {
	
	//Just change the "No" here to a "Yes" for automatic validation
	createUser(message,"No");


	base('Clients').create([
		{
			
			"fields": {
				"Name": message.trackingData.nameReg,
				"Mobile": message.trackingData.mobileReg,
				"Email": message.trackingData.emailReg,
				//"Group": clientGroup,
				"Referral": message.trackingData.referral,
				//"Share Referral": makeid(6),
				"Viber ID": clientID
			} 
		}], function(err, records) {
			if (err) {
				console.error(err);
				return;
			}
		
		});
}

function registrationBrokerPRC(message, response){
	let confirm_code = makeid(6);

	createUser(message,"No",confirm_code);

	const txt_confirm = "We will contact you as soon as we confirm your registration with the Admin.";
				

	//base('Brokers (PRC)').create([
	base('Brokers (PRC)').create([
		{
			"fields": {
				"Name": message.trackingData.nameReg,
				"Mobile": message.trackingData.mobileReg,
				"Email": message.trackingData.emailReg,
				//"Group": message.trackingData.groupType,
				"Referral": message.trackingData.referral,
				//"Share Referral": makeid(6),
				"PRC Number": message.trackingData.prcNumber,
				// "PRC Expiration": message.trackingData.prcExp,
				"PRC Image": [{
					"url" : message.trackingData.prcImage
				}],
				//"Validated": "No",
				"Viber ID": message.trackingData.userid,
				"Confirm Code": confirm_code,
				"Board Affiliation": message.trackingData.boardAffiliation
			} 
		}], function(err, records) {
			if (err) {
				console.error(err);
				return;
			}
		
		});

		response.send(new TextMessage(txt_confirm, checkKb,null,null,null,3),{
			statusid: "reg-confirm",
			userid: response.userProfile.id,
			nameReg: message.trackingData.nameReg,
			groupType: message.trackingData.groupType,
			subGroup: message.trackingData.subGroup
		});
}


function registrationBrokerHLURB(message,response){
	
	
	
	let ID = null;

	let confirm_code = makeid(6);


	(async () => {
		
		try {
			const readRes = await airTablePRC.read({
				filterByFormula:`{PRC Number} = "${message.trackingData.hlurbSupervisorLicense}"`
			});		
			//console.log(readRes + "\n\n\n\n\n\n\n");		
			if (readRes.length == 0) {
				
				const txt_sorry = "Sorry, looks like your supervising broker hasn't registered yet. Tell your broker about this awesome group. Thank you for your interest!";
				const sorryKb = {
					"Type": "keyboard",
					"InputFieldState": "hidden",
					"Buttons": [{
						"Text": "<b><font color=\"#000000\">Go back</font></b>",
						"ActionType": "reply",
						"ActionBody": "CANCEL1",
						"BgColor": "#FFAA88",
						"TextOpacity": 100,
						"Rows": 1,
						"Columns": 6
					}]
				};
				response.send(new TextMessage(txt_sorry, sorryKb ,null,null,null,3),{
					statusid: "registration",
					userid: response.userProfile.id,
					groupType: message.trackingData.groupType,
					subGroup: message.trackingData.subGroup
				});
			}
				
			else {
				const txt_confirm = "We will contact you as soon as we confirm your registration with your supervising broker.";
				
	
				base('Brokers (HLURB)').create([
					{
						"fields": {
							"Name": message.trackingData.nameReg,
							"Mobile": message.trackingData.mobileReg,
							"Email": message.trackingData.emailReg,
							//"Group": message.trackingData.groupType,
							"Referral": message.trackingData.referral,
							//"Share Referral": makeid(6),
							"HLURB/PRC": message.trackingData.hlurbNumber,
							//"HLURB/PRC Expiration": message.trackingData.hlurbExp,
							"Supervisor": message.trackingData.hlurbSupervisor,
							"Supervisor PRC": message.trackingData.hlurbSupervisorLicense,
							"HLURB/PRC Image": [{
								"url" : message.trackingData.hlurbImage
							}],
							"Validated": "No",
							"Viber ID": message.trackingData.userid,
							"Confirm Code": confirm_code
						} 
					}], function(err, records) {
						if (err) {
							console.error(err);
							return;
						}
						
					});
				
				createUser(message,"No",confirm_code);

	
				response.send(new TextMessage(txt_confirm, checkKb,null,null,null,3),{
					statusid: "reg-confirm",
					userid: response.userProfile.id,
					nameReg: message.trackingData.nameReg,
					groupType: message.trackingData.groupType,
					subGroup: message.trackingData.subGroup
				});

				
				let broker = {};
				broker.id = readRes[0].fields["Viber ID"];
				broker.name = readRes[0].fields["Name"];
				const confirm_txt = new TextMessage(`Someone wishes to register as your salesperson.\n` +
				`Name: ${message.trackingData.nameReg}\n` +
				`Mobile: ${message.trackingData.mobileReg}\n` +
				`Email: ${message.trackingData.emailReg}\n` +
				`HLURB DHSUD Accreditation ID/ Company ID/ Valid Government ID: ${message.trackingData.hlurbNumber}\n` +
				`Here is the submitted DHSUD Accreditation ID/ Company ID/ Valid Government ID.\n`);
				const confirm_id = new PictureMessage(message.trackingData.hlurbImage);
				const confirm_txt2 = new TextMessage(`Please only authorize him/her when you have full direct supervision and accountability of him/her as defined in RESA Law R.A. 9646 Section 31. You can confirm his/her status by following Main Menu-> My Account->My Salespersons.`,cancel2Kb,null,null,null,3);
				const msgArray = [confirm_txt, confirm_id, confirm_txt2];
				console.log(broker.id);
				console.log(track[broker.id]+"\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n");
				bot.sendMessage(broker, msgArray,{
					userid : readRes[0].fields["Viber ID"],
					groupType : "Broker",
					subGroup : "PRC"
				});
				


				
			}
			
				
		} catch (e){
			//console.log("Error\n\n\n\n\n\n\n");
			console.error(e)
		}
		
	}
	)();



}

function registrationBrokerNoLicense(message,response){
	
	let confirm_code = makeid(6);
	createUser(message,"No",confirm_code);
	base('Brokers (JOIN)').create([
		{
			"fields": {
				"Name": message.trackingData.nameReg,
				"Mobile": message.trackingData.mobileReg,
				"Email": message.trackingData.emailReg,
				//"Group": message.trackingData.groupType,
				"Referral": message.trackingData.referral,
				//"Share Referral": makeid(6),
				"Viber ID": message.trackingData.userid,
				"Confirm Code": confirm_code
			} 
		}], function(err, records) {
			if (err) {
				console.error(err);
				return;
			}
		
		});

	const groupKb = {
		"Type": "keyboard",
		"InputFieldState": "hidden",
		"Buttons": [{
		"Text": "<b><font color=\"#000000\">GO BACK TO MAIN MENU</font></b>",
		"ActionType": "reply",
		"ActionBody": "CANCEL1",
		"BgColor": "#FFAA88",
		"TextOpacity": 100,
		"Rows": 1,
		"Columns": 6
	}]
	};
	response.send(new TextMessage('We will send you a link when this is ready.', groupKb,null,null,null,4),{
		statusid: "registered-join",
		userid: response.userProfile.id,
		nameReg: message.trackingData.nameReg,
		groupType: message.trackingData.groupType,
		subGroup: message.trackingData.subGroup
	})
}

function mainEnlistBroker(message, response){
	td = message.trackingData;
	
	async function api(){
		/*
		let apiQuery = "https://us1.locationiq.com/v1/reverse.php?key=" + process.env.LOCATION_TOKEN;
		let lat =`&lat=`+ message.trackingData.latitude;
		let lon = `&lon=`+ message.trackingData.longitude;
		let apiResponse = await fetch(apiQuery + lat + lon + `&format=json`);
		let loc = await apiResponse.json();
		let city = loc.address.city;
		let town = loc.address.town;
		let municipality = loc.address.municipality;
		let county = loc.address.county;
		let region = loc.address.region;
		let state = loc.address.state;
		let address = loc.display_name;
		let area_arr = address.split(",");
		let len = area_arr.length;
		//console.log("display_name: " + address);
		//console.log(area_arr);
		//console.log(len);
		
		let area = " ";
		let zip = area_arr[len-2];
		if (isNaN(area_arr[len-2])) { //check if not a zip code; l-1 is country
			area = `${area_arr[0]},${area_arr[1]},${area_arr[2]}`;
			zip = "null";
			//console.log(area_arr[len-2]);
		}
		else if (len >= 8) {
			area = `${area_arr[len-7]},${area_arr[len-6]},${area_arr[len-5]},${area_arr[len-4]},${area_arr[len-3]}`;
		}
		else if (len == 7) {
			area = `${area_arr[len-6]},${area_arr[len-5]},${area_arr[len-4]},${area_arr[len-3]}`;
		} else {
			area = `${area_arr[len-5]},${area_arr[len-4]},${area_arr[len-3]}`;

		}

		////console.log("Region: " + region);
		////console.log("City: "+ city);
		if(city == null){
			if (town != null) {
				city = town;
			}
			else if (municipality != null) {
				city = municipality;
			}
			else if (county != null) {
				city = county;
			}
				city == "null";		
		}
		if(region == null){
			if (state != null) {
				region = state;
			}
			else
				region == "null";
		}
		*/

		/*
		if(isNaN(message.trackingData.floorArea) == true){
			message.trackingData.floorArea = 0;
		}

		if(isNaN(message.trackingData.lotArea) == true){
			message.trackingData.lotArea = 0;
		}

		if(isNaN(message.trackingData.rooms) == true){
			message.trackingData.rooms = 0;
		}
		*/		
		

		base('Properties').create([
			{
				"fields": {
					"Name": message.trackingData.nameReg,
					"Property Relation": message.trackingData.relationship,
					"Property Purpose": message.trackingData.property,
					"Property Type": message.trackingData.propertyType,
					"Commercial Type": message.trackingData.commercialType,
					//"Latitude": message.trackingData.latitude,
					//"Longitude": message.trackingData.longitude,
					"Location": (message.trackingData.location).toUpperCase(),
					//"Address": address,
					"City/Town": (td.city).toUpperCase(),
					// "Baranggay": (td.baranggay).toUpperCase(),
					"Baranggay": (td.baranggay).toUpperCase(),
					"Region/State": (td.region).toUpperCase(),
					//"Zip Code": zip,
					//"Area": area,
					"Location Name": message.trackingData.condoName,
					"Number of Rooms": parseInt(message.trackingData.rooms),
					"Floor Area": parseFloat(message.trackingData.floorArea),
					"Lot Area": parseFloat(message.trackingData.lotArea),
					"Furnishing": message.trackingData.furnishing,
					"Parking Slots": message.trackingData.parkingSlots,
					"Price": parseFloat(message.trackingData.price),
					"Property Image1": [{"url": message.trackingData.propertyImage[0]}],
					"Property Image2": [{"url": message.trackingData.propertyImage[1]}],
					"Property Image3": [{"url": message.trackingData.propertyImage[2]}],
					"Property Image4": [{"url": message.trackingData.propertyImage[3]}],
					"Property Image5": [{"url": message.trackingData.propertyImage[4]}],
					"Property Detail": message.trackingData.propertyDetail,
					"Group Type": message.trackingData.groupType,
					"Sub Group": message.trackingData.subGroup,
					"Commission Rate": message.trackingData.commissionRate,
					"Viber ID": message.trackingData.userid,
					//"Enlisting Code": makeid(6),
					//Change Validated value to 0
					"Validated": "1",
					"Broadcasted": "0"

				} 
			}], function(err, records) {
				if (err) {
					console.error(err);
					return;
				}
			
			});
	}
	api();
	
	const groupKb = {
		"Type": "keyboard",
		"InputFieldState": "hidden",
		"Buttons": [{
		"Text": "<b><font color=\"#000000\">Go back to Main Menu</font></b>",
		"ActionType": "reply",
		"ActionBody": "CANCEL2",
		"BgColor": "#FFAA88",
		"TextOpacity": 100,
		"Rows": 1,
		"Columns": 6
	}]
	};
	response.send(new TextMessage(`Thank you for your listing. I’m ${botName} Bot, your awesome Real Estate bot. Looking forward to talk to you again!`, groupKb,null,null,null,4),{
		statusid: "registered",
		userid: response.userProfile.id,
		nameReg: message.trackingData.nameReg,
		groupType: message.trackingData.groupType,
		subGroup: message.trackingData.subGroup
	})
}

function mainEnlistClient(message, response){
	td = message.trackingData;

	async function api(){
		/*
		let apiQuery = "https://us1.locationiq.com/v1/reverse.php?key=e4300dd3e8dc91"
		let lat =`&lat=`+ message.trackingData.latitude;
		let lon = `&lon=`+ message.trackingData.longitude;
		let apiResponse = await fetch(apiQuery + lat + lon + `&format=json`);
		let loc = await apiResponse.json();
		let city = loc.address.city;
		let town = loc.address.town;
		let municipality = loc.address.municipality;
		let county = loc.address.county;
		let region = loc.address.region;
		let state = loc.address.state;
		let address = loc.display_name;
		let area_arr = address.split(",");
		let len = area_arr.length;
		//console.log("display_name: " + address);
		//console.log(area_arr);
		//console.log(len);
		
		let area = " ";
		let zip = area_arr[len-2];
		if (isNaN(area_arr[len-2])) { //check if not a zip code; l-1 is country
			area = `${area_arr[0]},${area_arr[1]},${area_arr[2]}`;
			zip = "null";
			//console.log(area_arr[len-2]);
			//console.log("Area: " + area);
		}
		else if (len >= 8) {
			area = `${area_arr[len-7]},${area_arr[len-6]},${area_arr[len-5]},${area_arr[len-4]},${area_arr[len-3]}`;
			//console.log("Area: " + area);
		}
		else if (len == 7) {
			area = `${area_arr[len-6]},${area_arr[len-5]},${area_arr[len-4]},${area_arr[len-3]}`;
		} else {
			area = `${area_arr[len-5]},${area_arr[len-4]},${area_arr[len-3]}`;
			//console.log("Area: " + area);

		}

		////console.log("Region: " + region);
		////console.log("City: "+ city);
		if(city == null){
			if (town != null) {
				city = town;
			}
			else if (municipality != null) {
				city = municipality;
			}
			else if (county != null) {
				city = county;
			}
				city == "null";		
		}
		if(region == null){
			if (state != null) {
				region = state;
			}
			else
				region == "null";
		}
		*/

		/*
		if(isNaN(message.trackingData.floorArea) == true){
			message.trackingData.floorArea = 0;
		}

		if(isNaN(message.trackingData.lotArea) == true){
			message.trackingData.lotArea = 0;
		}
		*/
		
		

		base('Properties').create([
			{
				"fields": {
					"Name": message.trackingData.nameReg,
					"Property Relation": message.trackingData.relationship,
					"Property Purpose": message.trackingData.property,
					"Property Type": message.trackingData.propertyType,
					"Commercial Type": message.trackingData.commercialType,
					//"Latitude": message.trackingData.latitude,
					//"Longitude": message.trackingData.longitude,
					"Location": message.trackingData.location,
					//"Address": address,
					"City/Town": td.city,
					"Baranggay": td.baranggay,
					"Region/State": td.region,
					//"Zip Code": zip,
					//"Area": area,
					"Location Name": message.trackingData.condoName,
					"Number of Rooms": parseInt(message.trackingData.rooms),
					"Floor Area": parseFloat(message.trackingData.floorArea),
					"Lot Area": parseFloat(message.trackingData.lotArea),
					"Furnishing": message.trackingData.furnishing,
					"Parking Slots": message.trackingData.parkingSlots,
					"Price": parseFloat(message.trackingData.price),
					"Property Image1": [{"url": message.trackingData.propertyImage[0]}],
					"Property Image2": [{"url": message.trackingData.propertyImage[1]}],
					"Property Image3": [{"url": message.trackingData.propertyImage[2]}],
					"Property Image4": [{"url": message.trackingData.propertyImage[3]}],
					"Property Image5": [{"url": message.trackingData.propertyImage[4]}],
					"Property Detail": message.trackingData.propertyDetail,
					"Group Type": message.trackingData.groupType,
					"Sub Group": message.trackingData.subGroup,
					"Viber ID": message.trackingData.userid,
					//"Enlisting Code": makeid(6),
					"Validated": "0",
					"Broadcasted": "0"
				} 
			}], function(err, records) {
				if (err) {
					console.error(err);
					return;
				}
			
			});
	}
	api();

	
	const groupKb = {
		"Type": "keyboard",
		"InputFieldState": "hidden",
		"Buttons": [{
		"Text": "<b><font color=\"#000000\">GO BACK TO MAIN MENU</font></b>",
		"ActionType": "reply",
		"ActionBody": "CANCEL2",
		"BgColor": "#FFAA88",
		"TextOpacity": 100,
		"Rows": 1,
		"Columns": 6
	}]
	};
	response.send(new TextMessage(`Thank you for your listing. I’m ${botName} Bot, your awesome Real Estate bot. Looking forward to talk to you again!`, groupKb,null,null,null,4),{
		statusid: "registered",
		userid: response.userProfile.id,
		nameReg: message.trackingData.nameReg,
		groupType: message.trackingData.groupType,
		subGroup: message.trackingData.subGroup
	})
}

async function propertyInquiry(message,response){
	td = message.trackingData;
	async function api(){
		/*
		let apiQuery = "https://us1.locationiq.com/v1/reverse.php?key=e4300dd3e8dc91"
		let lat =`&lat=`+ message.trackingData.latitude;
		let lon = `&lon=`+ message.trackingData.longitude;
		let apiResponse = await fetch(apiQuery + lat + lon + `&format=json`);
		let loc = await apiResponse.json();
		let city = loc.address.city;
		let town = loc.address.town;
		let municipality = loc.address.municipality;
		let county = loc.address.county;
		let region = loc.address.region;
		let state = loc.address.state;
		let address = loc.display_name;
		let area_arr = address.split(",");
		let len = area_arr.length;
		//console.log("display_name: " + address);
		//console.log(area_arr);
		//console.log(len);
		
		let area = " ";
		let zip = area_arr[len-2];
		if (isNaN(area_arr[len-2])) { //check if not a zip code; l-1 is country
			area = `${area_arr[0]},${area_arr[1]},${area_arr[2]}`;
			zip = "null";
			//console.log(area_arr[len-2]);
			//console.log("Area: " + area);
		}
		else if (len >= 8) {
			area = `${area_arr[len-7]},${area_arr[len-6]},${area_arr[len-5]},${area_arr[len-4]},${area_arr[len-3]}`;
			//console.log("Area: " + area);
		}
		else if (len == 7) {
			area = `${area_arr[len-6]},${area_arr[len-5]},${area_arr[len-4]},${area_arr[len-3]}`;
		} else {
			area = `${area_arr[len-5]},${area_arr[len-4]},${area_arr[len-3]}`;
			//console.log("Area: " + area);

		}

		
		if(city == null){
			if (town != null) {
				city = town;
			}
			else if (municipality != null) {
				city = municipality;
			}
			else if (county != null) {
				city = county;
			}
				city == "null";		
		}
		if(region == null){
			if (state != null) {
				region = state;
			}
			else
				region == "null";
		}
		*/
		let text;
		var broadcasted = "0";
		var validated;
		if(message.text == "Yes"){
			text = "Yes"
		} else if(message.text == "No"){
			text = "No"
		}
		if(message.trackingData.groupType == "Client"){
			validated = "0";
		} else {
			validated = "1";
		}

		inquiryCode = makeid(6);

		const readRes = await airTableUsers.read({
		filterByFormula: `{VIBER ID} = "${message.trackingData.userid}"`
		});

		// var subscribed = 0
		// if(readRes[0]["fields"]["Subscribed"]){
		// 	subscribed = readRes[0]["fields"]["Subscribed"]
		// }

		base('Inquiries').create([
			{
				"fields": {
					"Name": message.trackingData.nameReg,
					"Property Relation": message.trackingData.relationship,
					"Property Purpose": message.trackingData.property,
					"Property Type": message.trackingData.propertyType,
					"Commercial Type": message.trackingData.commercialType,
					//"Latitude": message.trackingData.latitude,
					//"Longitude": message.trackingData.longitude,
					"Location": message.trackingData.location,
					//"Address": address,
					"City/Town": td.city,
					"Baranggay": td.baranggay,
					"Region/State": td.region,
					//"Zip Code": zip,
					//"Area": area,
					"Location Name": message.trackingData.condoName,
					"Number of Rooms": message.trackingData.rooms,
					"Floor Area Min": message.trackingData.floorAreaMin,
					"Floor Area Max": message.trackingData.floorAreaMax,
					"Lot Area Min": message.trackingData.lotAreaMin,
					"Lot Area Max": message.trackingData.lotAreaMax,
					"Furnishing": message.trackingData.furnishing,
					"Parking Slots": message.trackingData.parkingSlots,
					"Minimum Budget": message.trackingData.minimumPrice,
					"Maximum Budget": message.trackingData.maximumPrice,
					"Group Type": message.trackingData.groupType,
					"Contact": text,
					"Viber ID": message.trackingData.userid,
					"Inquire Formula": formulaStore[message.trackingData.userid],
					"Broadcasted": broadcasted,
					"Validated": validated,
					// for deleting matches with inquiry
					"Inquiry Code": inquiryCode
				} 
			}], function(err, records) {
				if (err) {
					console.error(err);
					return;
				}
			
			});
	}
	api();

	// if(subscribed == 1){
	// 	setMatches(message,td,inquiryCode);		
	// }

	

	const groupKb = {
		"Type": "keyboard",
		"InputFieldState": "hidden",
		"Buttons": [{
		"Text": "<b><font color=\"#000000\">Go Back to Main Menu</font></b>",
		"ActionType": "reply",
		"ActionBody": "CANCEL2",
		"BgColor": "#FFAA88",
		"TextOpacity": 100,
		"Rows": 1,
		"Columns": 6
	}]
	};
	response.send(new TextMessage(`Thank you for your inquiry!\nI’m ${botName} Bot, your awesome Real Estate bot and talk to you again soon! `, groupKb,null,null,null,4),{
		statusid: "registered",
		userid: response.userProfile.id,
		nameReg: message.trackingData.nameReg,
		groupType: message.trackingData.groupType,
		subGroup: message.trackingData.subGroup
	})
}

function submission(message){
	(async () => {
		try{
			const readRes = await airTableProperties.read({
				filterByFormula: `{Viber ID} = "${message.trackingData.userid}"`,
				// filterByFormula: `{Viber ID} = "59aHi2HKPBcUjbxUJQlhiQ=="`,
			})
			//console.log(readRes);		
			submissionPayload[message.trackingData.userid] = readRes;
		} catch (e){
			console.error(e)
		}
	})();
}

function search(message){
	(async () => {
		try{
			const readRes = await airTableSearch.read({
			filterByFormula: `{Viber ID} = "${message.trackingData.userid}"`,
		})
			//console.log(readRes);		
			searchPayload[message.trackingData.userid] = readRes;
			//console.log(searchPayload[message.trackingData.userid])
		} catch (e){
			console.error(e)
		}
	})();
}

function supervision(message){
	(async () => {
		try{
			const readRes = await airTablePRC.read({
			filterByFormula: `{Viber ID} = "${message.trackingData.userid}"`,
			})
			//console.log(readRes);		
			if(readRes.length == 0){
				supervisionPayload[message.trackingData.userid] = [];
			} else {
				const readRes2 = await airTableHLURB.read({
					filterByFormula: `{Supervisor PRC} = "${readRes[0].fields["PRC Number"]}"`,
				});
				if(readRes2.length == 0){
					supervisionPayload[message.trackingData.userid] = [];
				} else {
					supervisionPayload[message.trackingData.userid] = readRes2;
				}
			}
						
			
			
			//console.log(searchPayload[message.trackingData.userid])
		} catch (e){
			console.error(e)
		}

		

	})();
}

function changeSupervision(message){
	(async () => {
		try{
			const updateRes = await airTableHLURB.updateWhere(`{Viber ID} = "${message.trackingData.confirmCodeValidate}"`, {
				Validated: "Yes"
			});
			
			const updateRes2 = await airTableUsers.updateWhere(`{Viber ID} = "${message.trackingData.confirmCodeValidate}"`, {
				Validated: "Yes"
			});

			const readRes = await airTableHLURB.read({
				filterByFormula: `{Viber ID} = "${message.trackingData.confirmCodeValidate}"`,
			});

			const changeKb = {
				"Type": "keyboard",
				"InputFieldState": "hidden",
				"Buttons": [{
					"Text": "<b><font color=\"#000000\">GO BACK TO MENU</font></b>",
					"ActionType": "reply",
					"ActionBody": "CANCEL2",
					"BgColor": "#FFAA88",
					"TextOpacity": 100,
					"Rows": 1,
					"Columns": 6
				}]
			};
			let broker = {};
			broker.id = readRes[0].fields["Viber ID"];
			broker.name = readRes[0].fields["Name"];
			const confirm_txt = new TextMessage(`Hi ${broker.name}. Your account has been validated by your supervisor. You are now able to use our services. Please press the button to go back to the menu.`,changeKb,null,null,null,4);
			//console.log(broker.id);
			//console.log(track[broker.id]+"\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n");
			bot.sendMessage(broker, confirm_txt,{
				userid : readRes[0].fields["Viber ID"],
				groupType : "Broker",
				subGroup : "HLURB"
			});

			//console.log(searchPayload[message.trackingData.userid])
		} catch (e){
			console.error(e)
		}
	})();
}

function validatedBroker(message){

	(async () => {
		try{
			const readRes = await airTablePRC.read({
				filterByFormula: `{Viber ID} = "${message.trackingData.userid}"`,
			})
			//console.log(readRes);		
			if(readRes.length == 0){
				validatedPayload[message.trackingData.userid] = [];
			} else {
				const readRes2 = await airTableHLURB.read({
					filterByFormula: `AND({Supervisor PRC} = "${readRes[0].fields["PRC Number"]}", {Validated} = "Yes")`,
				});
				if(readRes2.length == 0){
					validatedPayload[message.trackingData.userid] = [];
				} else {
					validatedPayload[message.trackingData.userid] = readRes2;
				}
			}
						
			//console.log(searchPayload[message.trackingData.userid])
		} catch (e){
			console.error(e)
		}

		

	})();
}

function removeSupervision(message){
	(async () => {
		try{
			const updateRes = await airTableHLURB.updateWhere(`{Viber ID} = "${message.trackingData.confirmCode}"`, {
				Validated: "No"
			});
			
			const updateRes2 = await airTableUsers.updateWhere(`{Viber ID} = "${message.trackingData.confirmCode}"`, {
				Validated: "No"
			});

			const updateRes3 = await airTableProperties.updateWhere(`{Viber ID} = "${message.trackingData.confirmCode}"`, {
				Validated: "0"
			});

			/*
			const readRes = await airTableHLURB.read({
				filterByFormula: `{Confirm Code} = "${message.trackingData.confirmCode}"`,
			});
			*/

			//let broker = {};
			//broker.id = readRes[0].fields["Viber ID"];
			//broker.name = readRes[0].fields["Name"];
			//const confirm_txt = new TextMessage(`Hi ${broker.name}. Your account has been validated by your supervisor. You are now able to use our services. Please press the button to go back to the menu.`,cancel2Kb);
			//console.log(broker.id);
			//console.log(track[broker.id]+"\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n");
			//bot.sendMessage(broker, confirm_txt,track[broker.id]);

			//console.log(searchPayload[message.trackingData.userid])
		} catch (e){
			console.error(e)
		}
	})();
}

function deleteEntry(message){
	
	(async () => {
		try{
			
			const rest = await airTableProperties.deleteWhere(`{Enlisting Code} = "${message.trackingData.enlistCode}"`);
			// for deleting matches along with properties
			//const rest2 = await airTableExact.deleteWhere(`{Enlisting Code} = "${message.trackingData.enlistCode}"`);
			//const rest3 = await airTableRecommended.deleteWhere(`{Enlisting Code} = "${message.trackingData.enlistCode}"`);
		} catch (e){
			console.error(e)
		}
	})();
}

function editProperty(message){
	let param = message.trackingData.editParameter;
	let edit = message.trackingData.toEdit;
	let val = {}
	
	if(param == "Property Purpose"){
		val = {"Property Purpose": edit}	
	} else if(param == "Property Type"){
		val = {"Property Type": edit}	
	} else if(param == "Condo/Area/Building Name"){
		val = {"Location Name": edit}	
	} else if(param == "Number of Rooms"){
		val = {"Number of Rooms": parseInt(edit)}	
	} else if(param == "Floor Area"){
		val = {"Floor Area": parseFloat(edit)}	
	} else if(param == "Lot Area"){
		val = {"Lot Area": parseFloat(edit)}	
	} else if(param == "Furnishing"){
		val = {"Furnishing": edit}	
	} else if(param == "Parking Slots"){
		val = {"Parking Slots": edit}	
	} else if(param == "Price"){
		val = {"Price": parseInt(edit)}	
	} else if(param == "Property Detail"){
		val = {"Property Detail": edit}	
	}

	(async () => {
		try{
			const updateRes = await airTableProperties.updateWhere(`{Enlisting Code} = "${message.trackingData.enlistCode}"`,val );
		
		} catch (e){
			console.error(e)
		}
	})();
}

//CHANGE

async function sendBotWeb(message, response, td) {
	const readRes2 = await airTablePRC.read({
		filterByFormula: `{Viber ID} = "${message.trackingData.userid}"`,
	})

	portalURL = readRes2[0].fields["Portal URL"];

	const botWebKb = {
		"Type": "keyboard",
		"InputFieldState": "hidden",
		"Buttons": [{
			"Columns": 3,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>My Listings</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "open-url",
			"TextSize": "medium",
			"ActionBody": `${portalURL}`,
			"OpenURLType": "internal",
			"Silent": "true",
			"BgColor": "#edbf80",
		},  {
			"Columns": 3,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>All Listings</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "open-url",
			"TextSize": "medium",
			"ActionBody": `https://app.miniextensions.com/grid-editor/PabUdEksM6wBfTLa3WAN`,
			"OpenURLType": "internal",
			"Silent": "true",
			"BgColor": "#c7b0e6",
		},
		//  {
		// 	"Columns": 3,
		// 	"Rows": 1,
		// 	"Text": "<font color=\"#494E67\"><b>Repository</b></font>",
		// 	"TextSize": "medium",
		// 	"TextHAlign": "center",
		// 	"TextVAlign": "middle",
		// 	"ActionType": "open-url",
		// 	"TextSize": "medium",
		// 	"ActionBody": `https://airtable.com/shrPNUnzIKMKpCLr3`,
		// 	"OpenURLType": "internal",
		// 	"Silent": "true",
		// 	"BgColor": "#c7b0e6",
		// }, 
		// {
		// 	"Columns": 3,
		// 	"Rows": 1,
		// 	"Text": "<font color=\"#494E67\"><b>PAREB Affiliates</b></font>",
		// 	"TextSize": "medium",
		// 	"TextHAlign": "center",
		// 	"TextVAlign": "middle",
		// 	"ActionType": "open-url",
		// 	"TextSize": "medium",
		// 	"ActionBody": `https://airtable.com/shrPtTdqgsL0VZRbm`,
		// 	"OpenURLType": "internal",
		// 	"Silent": "true",
		// 	"BgColor": "#edbf80",
		// }, 
		{
			"Columns": 3,
			"Rows": 1,
			"Text": "<font color=\"#494E67\"><b>nrealistings.com</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"TextSize": "small",
			"ActionBody": `aeloop`,
			"Silent": "true",
			"BgColor": "#edbf80",
		},  {
			"Columns": 3,
			"Rows": 1,
			"Text": "<font color=\"#000000\"><b>Go Back To Main Menu</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"TextSize": "medium",
			"ActionBody": "CANCEL2",
			"BgColor": "#FFAA88",
		}]
	}

	response.send(new TextMessage("Please select from the following", botWebKb,null,null,null,4),td);
}

//CHANGE

async function aeloop(message, response, td) {
	const readRes2 = await airTableUsers.read({
		filterByFormula: `{Viber ID} = "${message.trackingData.userid}"`,
	})
	
	portalPassword = readRes2[0].fields["Portal Password"];
	userID = readRes2[0].fields["User ID"];
	text = `Your credentials are:
	User ID = ${userID}
	Portal Password = ${portalPassword}`;

	const botWebKb = {
		"Type": "keyboard",
		"InputFieldState": "hidden",
		"Buttons": [{
			"Columns": 6,
			"Rows": 1,
			"Text": "<font color=\"#000000\"><b>Go Back To Main Menu</b></font>",
			"TextSize": "medium",
			"TextHAlign": "center",
			"TextVAlign": "middle",
			"ActionType": "reply",
			"TextSize": "medium",
			"ActionBody": "CANCEL2",
			"BgColor": "#FFAA88",
		}]
	}

	response.send(new TextMessage(text, botWebKb,null,null,null,4),td);
}


function feedBackSend(message,response){
	td = message.trackingData;
	(async () => {
		try{
			const createRes = await airTableFeedback.create({
				"Name": td.nameReg,
				"Viber ID": td.userid,
				"Feedback": message.text,
				"Group":td.groupType,
			});
			

		} catch (e){
			console.error(e)
		}
	})();
	//td.statusid = "mainMenu"
	//response.send(new TextMessage("Thank you for the feedback!",mainMenuKb,null,null,null,4),td);
}

function deleteSavedSearch(message){
	
	(async () => {
		try{
			
			// for deleting matches with inquiries
			var inquiryCodeArray = await airTableSearch.read({
				// filterByFormula: `{ID} = "recq1P9ND0tU7pFjt"`
				filterByFormula: `{Record ID} = "${message.trackingData.recordDelete}"`
			});
						
			if(inquiryCodeArray[0].fields["Inquiry Code"]){
				inquiryCode = inquiryCodeArray[0].fields["Inquiry Code"]
				//const rest2 = await airTableExact.deleteWhere(`{Inquiry Code} = "${inquiryCode}"`);
				//const rest3 = await airTableRecommended.deleteWhere(`{Inquiry Code} = "${inquiryCode}"`);
			}

			const rest = await airTableSearch.deleteWhere(`{Record ID} = "${message.trackingData.recordDelete}"`);
			
		} catch (e){
			console.error(e)
		}
	})();
}

///////////////////////////////////////
// END AirTable Functions ////////////
///////////////////////////////////////


///////////////////////////////////////
// KEYBOARDS //////////////////////////
///////////////////////////////////////


const learnKb = {
	"Type": "keyboard",
	"Buttons": [{
		"Text": "<b><font color=\"#000000\">Social Media</font></b>",
		"ActionType": "reply",
		"ActionBody": "Social Media",
		"BgColor": "#edbf80",
		"TextOpacity": 100,
		"Rows": 1,
		"Columns": 6
	}, {
		"Text": "<b><font color=\"#000000\">Invitation</font></b>",
		"ActionType": "reply",
		"ActionBody": "Invitation",
		"BgColor": "#c7b0e6",
		"TextOpacity": 100,
		"Rows": 1,
		"Columns": 6
	}, 
	{
		"Text": "<b><font color=\"#000000\">START AGAIN</font></b>",
		"ActionType": "reply",
		"ActionBody": "CANCEL1",
		"BgColor": "#FFAA88",
		"TextOpacity": 100,
		"Rows": 1,
		"Columns": 6
	}]
};

const boardKb = {
	"Type": "keyboard",
	"InputFieldState": "hidden",
	"Buttons": [
	 {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Caloocan Malabon Navotas Valenzuela Real Estate Board</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "CAMANAVA",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>City Of Taguig Real Estate Board</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "CTREB",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Las Piñas City Real Estate Board</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "LPCREB",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Mandaluyong City Realtors Board</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "MCRB",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Manila Board Of Realtors</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "MBR",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Marikina Valley Realtors Board</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "MVRB",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Muntinlupa Real Estate Board</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "MUNREB",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Paranaque-Las Piñas Alabang Realtors Board</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "PLAREB",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Pasay Makati Realty Board</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "PMRB",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Pasig Real Estate Board</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "PRB",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Pateros Realtors Board</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "PATREB",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Quezon City Realtors Boards</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "QCRB",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>San Juan Realtors Board</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "SJRB",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Next Page</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "BOARD2",
		"BgColor": "#FFAA88",
	}]
};

const boardKb2 = {
	"Type": "keyboard",
	"InputFieldState": "hidden",
	"Buttons": [
	 {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Bulacan Realtors Board</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "BRB",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>City Of Fernando Pampanga Real Estate Board</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "CSFPREB",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Metro Angeles Real Estate Board</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "MAREB",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Metro Baguio Realtors Board</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "MBRB",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Metro Pangasinan Real Estate Board</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "MPREB",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Santiago City Realtors Board</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "RBSC",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Tarlac City Realtors Board</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "TCRB",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Next Page</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "BOARD3",
		"BgColor": "#FFAA88",
	}]
};

const boardKb3 = {
	"Type": "keyboard",
	"InputFieldState": "hidden",
	"Buttons": [
	 {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Antipolo City Realtors Board</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "ACRB",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Batangas City Real Estate Board</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "BCREBA",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Cainta Realtors Board</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "CRB",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Calamba Laguna Real Estate Board</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "CLRB",
		"BgColor": "#c7b0e6",
	},{
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Cavite City Realtors Board</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "CCRB",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Dasmariñas Real Estate Board</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "DASMAREB",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Real Estate Board Of Lipa City, Inc.</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "RBLC",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Lucena City Quezon Realtors Board</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "LCQBRI",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Naga City (Camsur) Realtors Board, Inc.</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "NCRB",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Palawan Realtors Board, Inc.</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "PALREB",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Real Estate Board Of Rizal</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "RBR",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>San Pablo City Realtors</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "SPCRB",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 6,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Next Page</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "BOARD4",
		"BgColor": "#FFAA88",
	}]
};

const boardKb4 = {
	"Type": "keyboard",
	"InputFieldState": "hidden",
	"Buttons": [
	 {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Bohol Real Estate Board, Inc.</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "BOREB",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Cebu Real Estate Board</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "CEREB",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Cebu North Real Estate Board, Inc.</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "CENOREB",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Cebu South Real Estate Board, Inc.</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "CENOREB",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Ilo-Ilo City Realtors Board</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "ICRB",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Mactan Mandaue Bridge Cities Realtors Board, Inc.</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "MAMAREB",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Metro Tacloban Real Estate Board, Inc</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "METREB",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Negros Occidental Realtors Board</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "NOREBI",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 6,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Next Page</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "BOARD5",
		"BgColor": "#FFAA88",
	}]
};

const boardKb5 = {
	"Type": "keyboard",
	"InputFieldState": "hidden",
	"Buttons": [
	{
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Cagayan De Oro Real Estate Board</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "COREB",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Davao Board Of Realtors Foundation, Inc</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "DBRFI",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Dipolog Dapitan Real Estate Board</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "DDREB",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>General Santos-Sarangani Realtors Board</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "GENSARRREB",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Zamboaga Real Estate Board</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "ZAREB",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Back to first page</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "BOARD1",
		"BgColor": "#FFAA88",
	}]
};

const startKb = {
	"Type": "keyboard",
	"Buttons": [{
		"Text": "<b><font color=\"#000000\">START AGAIN</font></b>",
		"ActionType": "reply",
		"ActionBody": "CANCEL1",
		"BgColor": "#FFAA88",
		"TextOpacity": 100,
		"Rows": 1,
		"Columns": 6
	}]
};

const cancel2Kb = {
	"Type": "keyboard",
	"Buttons": [{
		"Text": "<b><font color=\"#000000\">GO BACK TO MENU</font></b>",
		"ActionType": "reply",
		"ActionBody": "CANCEL2",
		"BgColor": "#FFAA88",
		"TextOpacity": 100,
		"Rows": 1,
		"Columns": 6
	}]
};

const myAccountKb = {
	"Type": "keyboard",
	"Buttons": [{
		"Text": "<b><font color=\"#000000\">Go Back to My Account</font></b>",
		"ActionType": "reply",
		"ActionBody": "My Account",
		"BgColor": "#FFAA88",
		"TextOpacity": 100,
		"Rows": 1,
		"Columns": 6
	}]
};

const proceedKb = {
	"Type": "keyboard",
	"InputFieldState": "hidden",
	"Buttons": [{
		"Text": "<b><font color=\"#FFFFFF\">PROCEED</font></b>",
		"ActionType": "reply",
		"ActionBody": "Proceed",
		"BgColor": "#0000FF",
		"TextOpacity": 100,
		"Rows": 1,
		"Columns": 6
	}]
};

const yesnoKb = {
	"Type": "keyboard",
	"InputFieldState": "hidden",
	"Buttons": [{
		"Columns": 3,
		"Rows": 2,
		"Text": "<font color=\"#494E67\"><b>YES</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Yes",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 2,
		"Text": "<font color=\"#494E67\"><b>NO</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "No",
		"BgColor": "#c7b0e6",
	}, {
		"Text": "<b><font color=\"#000000\">BACK TO MAIN MENU</font></b>",
		"ActionType": "reply",
		"ActionBody": "CANCEL2",
		"BgColor": "#FFAA88",
		"TextOpacity": 100,
		"Rows": 1,
		"Columns": 6
	}]
};		

const noneKb = {
	"Type": "keyboard",
	"Buttons": [{
		"Text": "<b><font color=\"#000000\">SKIP</font></b>",
		"ActionType": "reply",
		"ActionBody": "None",
		"BgColor": "#c7b0e6",
		"TextOpacity": 100,
		"Rows": 1,
		"Columns": 6,
		"Silent": "true"
	},{
		"Text": "<b><font color=\"#000000\">GO BACK TO MENU</font></b>",
		"ActionType": "reply",
		"ActionBody": "CANCEL2",
		"BgColor": "#FFAA88",
		"TextOpacity": 100,
		"Rows": 1,
		"Columns": 6
	}]
};

const none2Kb = {
	"Type": "keyboard",
	"InputFieldState": "hidden",
	"Buttons": [{
		"Text": "<b><font color=\"#000000\">CONFIRM</font></b>",
		"ActionType": "reply",
		"ActionBody": "None",
		"BgColor": "#c7b0e6",
		"TextOpacity": 100,
		"Rows": 1,
		"Columns": 6,
		"Silent": "true"
	},{
		"Text": "<b><font color=\"#000000\">GO BACK TO MENU</font></b>",
		"ActionType": "reply",
		"ActionBody": "CANCEL2",
		"BgColor": "#FFAA88",
		"TextOpacity": 100,
		"Rows": 1,
		"Columns": 6
	}]
};

const confirmKb = {
	"Type": "keyboard",
	"InputFieldState": "hidden",
	"Buttons": [{
		"Text": "<b><font color=\"#FFFFFF\">CONFIRM</font></b>",
		"ActionType": "reply",
		"ActionBody": "Proceed",
		"BgColor": "#0000FF",
		"TextOpacity": 100,
		"Rows": 1,
		"Columns": 6
	},{
		"Text": "<b><font color=\"#000000\">CANCEL</font></b>",
		"ActionType": "reply",
		"ActionBody": "CANCEL1",
		"BgColor": "#FFAA88",
		"TextOpacity": 100,
		"Rows": 1,
		"Columns": 6
	}]

};

const checkKb = {
	"Type": "keyboard",
	"InputFieldState": "hidden",
	"Buttons": [{
		"Text": "<b><font color=\"#000000\">CHECK</font></b>",
		"ActionType": "reply",
		"ActionBody": "Check",
		"BgColor": "#edbf80",
		"TextOpacity": 100,
		"Rows": 1,
		"Columns": 6
	}]
};

const bypassKb = {
	"Type": "keyboard",
	"InputFieldState": "hidden",
	"Buttons": [{
		"Text": "<b><font color=\"#FFFFFF\">Go to Main Menu</font></b>",
		"ActionType": "reply",
		"ActionBody": "Proceed",
		"BgColor": "#0000FF",
		"TextOpacity": 100,
		"Rows": 1,
		"Columns": 6
	},{
		"Text": "<b><font color=\"#000000\">Delete Record and Register Again</font></b>",
		"ActionType": "reply",
		"ActionBody": "Delete",
		"BgColor": "#FFAA88",
		"TextOpacity": 100,
		"Rows": 1,
		"Columns": 6
	}]
};

const confirm2Kb = {
	"Type": "keyboard",
	"InputFieldState": "hidden",
	"Buttons": [{
		"Text": "<b><font color=\"#FFFFFF\">CONFIRM</font></b>",
		"ActionType": "reply",
		"ActionBody": "Confirm",
		"BgColor": "#0000FF",
		"TextOpacity": 100,
		"Rows": 1,
		"Columns": 6
	},{
		"Text": "<b><font color=\"#000000\">GO BACK TO MAIN MENU</font></b>",
		"ActionType": "reply",
		"ActionBody": "CANCEL2",
		"BgColor": "#FFAA88",
		"TextOpacity": 100,
		"Rows": 1,
		"Columns": 6
	}]
};

const continueKb = {
	"Type": "keyboard",
	"InputFieldState": "hidden",
	"Buttons": [{
		"Text": "<b><font color=\"#FFFFFF\">CONTINUE</font></b>",
		"ActionType": "reply",
		"ActionBody": "Continue",
		"BgColor": "#0000FF",
		"TextOpacity": 100,
		"Rows": 1,
		"Columns": 6
	},{
		"Text": "<b><font color=\"#000000\">GO BACK TO MAIN MENU</font></b>",
		"ActionType": "reply",
		"ActionBody": "CANCEL2",
		"BgColor": "#FFAA88",
		"TextOpacity": 100,
		"Rows": 1,
		"Columns": 6
	}]
};









const broadcastPreferenceKb = {
	"Type": "keyboard",
	"InputFieldState": "hidden",
	"Buttons": [{
		"Columns": 6,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Set Broadcast Preference</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "open-url",
		"ActionBody": "https://proptechph.com/broadcast_preference.html",
		"OpenURLType": "internal",
		"Silent": "true",
		"BgColor": "#c7b0e6",
		"TextOpacity": 100
	},{
		"Text": "<b><font color=\"#000000\">GO BACK TO MAIN MENU</font></b>",
		"ActionType": "reply",
		"ActionBody": "CANCEL2",
		"BgColor": "#FFAA88",
		"TextOpacity": 100,
		"Rows": 1,
		"Columns": 6
	}]
};


const submissionKb = {
	"Type": "keyboard",
	"InputFieldState": "hidden",
	"Buttons": [{
		"Columns": 3,
		"Rows": 2,
		"Text": "<font color=\"#494E67\"><b>EDIT</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Edit",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 2,
		"Text": "<font color=\"#494E67\"><b>DELETE</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Delete2",
		"BgColor": "#c7b0e6",
	}, {
		"Text": "<b><font color=\"#000000\">BACK TO MAIN MENU</font></b>",
		"ActionType": "reply",
		"ActionBody": "CANCEL2",
		"BgColor": "#FFAA88",
		"TextOpacity": 100,
		"Rows": 1,
		"Columns": 6
	}]
};

const editKb = {
	"Type": "keyboard",
	"InputFieldState": "hidden",
	"Buttons": [
		/*
		{
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Transaction</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Property Purpose",
		"BgColor": "#edbf80",
	},
	
	{
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Property Type</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Property Type",
		"BgColor": "#edbf80",
	},
	*/
	{
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Condo/Area/Building Name</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Condo/Area/Building Name",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Number of Rooms</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Number of Rooms",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Floor Area</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Floor Area",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Lot Area</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Lot Area",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Furnishing</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Furnishing",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Parking Slots</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Parking Slots",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Price</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Price",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Property Detail</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Property Detail",
		"BgColor": "#c7b0e6",
	}, {
		"Text": "<b><font color=\"#000000\">BACK TO MAIN MENU</font></b>",
		"ActionType": "reply",
		"ActionBody": "CANCEL2",
		"BgColor": "#FFAA88",
		"TextOpacity": 100,
		"Rows": 1,
		"Columns": 6
	}]
}

const commercialKb = {
	"Type": "keyboard",
	"InputFieldState": "hidden",
	"Buttons": [{
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Retail</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Retail",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Hotel</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Hotel",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Office Building</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Office Building",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Special Purpose</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Special Purpose",
		"BgColor": "#edbf80",
	}, {
		"Text": "<b><font color=\"#000000\">BACK TO MAIN MENU</font></b>",
		"ActionType": "reply",
		"ActionBody": "CANCEL2",
		"BgColor": "#FFAA88",
		"TextOpacity": 100,
		"Rows": 1,
		"Columns": 6
	}]
}

const furnishKb = {
	"Type": "keyboard",
	"InputFieldState": "hidden",
	"Buttons": [{
		"Columns": 3,
		"Rows": 2,
		"Text": "<font color=\"#494E67\"><b>Bare</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Bare",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 2,
		"Text": "<font color=\"#494E67\"><b>Furnished</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Furnished",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 6,
		"Rows": 2,
		"Text": "<font color=\"#494E67\"><b>GO BACK TO MAIN MENU</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "CANCEL2",
		"BgColor": "#FFAA88",
	}]
}

const propertyKb = {
	"Type": "keyboard",
	"InputFieldState": "hidden",
	"Buttons": [{
		"Columns": 3,
		"Rows": 2,
		"Text": "<font color=\"#494E67\"><b>For Sale</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "For Sale",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 2,
		"Text": "<font color=\"#494E67\"><b>For Lease</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "For Lease",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 6,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>GO BACK TO MENU</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "CANCEL2",
		"BgColor": "#FFAA88",
	}]
}

const propertyKb2 = {
	"Type": "keyboard",
	"InputFieldState": "hidden",
	"Buttons": [{
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Residential Condo</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Residential Condo",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Residential House & Lot</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Residential House & Lot",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Residential Vacant Lot</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Residential Vacant Lot",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Office Space</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Office Space",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Commercial with Improvements</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Commercial with Improvements",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Commercial Vacant Lot</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Commercial Vacant Lot",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Industrial with Improvements</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Industrial with Improvements",
		"BgColor": "#c7b0e6",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Industrial Vacant Lot</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Industrial Vacant Lot",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>Raw Land</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "Raw Land",
		"BgColor": "#edbf80",
	}, {
		"Columns": 3,
		"Rows": 1,
		"Text": "<font color=\"#494E67\"><b>GO BACK TO MAIN MENU</b></font>",
		"TextSize": "medium",
		"TextHAlign": "center",
		"TextVAlign": "middle",
		"ActionType": "reply",
		"ActionBody": "CANCEL2",
		"BgColor": "#FFAA88",
	}
	]
}

////////////////////////////
// VARIABLES////////////////
////////////////////////////

let imageStore = [];
let imageCount = [];
let inquirePayload = [];
let submissionPayload = [];
let searchPayload = [];
let referral = [];
let track = [];
let formulaStore = [];
let supervisionPayload = [];
let validatedPayload = [];
let pictureSent = []

/////////////////////////////////

///////////////////////////////////////
// INTENTS ////////////////////////////
///////////////////////////////////////
bot.on(BotEvents.MESSAGE_RECEIVED, (message, response) => {
	
	

	//Variables
	let text = message.text;
	const statusid = message.trackingData.statusid;
	const userid = message.trackingData.userid;
	let td = message.trackingData;
	track[userid] = td;

	if(text == 'CANCEL1' && userid == response.userProfile.id){
		//askReferral(response);
		askUserType(response);	
	}

	//CANCEL AFTER REGISTRATION
	else if(text == 'CANCEL2' && userid == response.userProfile.id){
		mainMenu(message,response);
	}

	else if(text && text.toUpperCase() == 'MENU' && userid == response.userProfile.id){
		mainMenu(message,response);
	}

	else if(text == 'Delete' && userid == response.userProfile.id){
		td.statusid = "confirmRegisterAgain";
		response.send(new TextMessage("Are you sure you want to re-register? You will go through the sign-up process again.",confirm2Kb,null,null,null,4),td);
	}
	else if(text == 'Confirm' && userid == response.userProfile.id && statusid == "confirmRegisterAgain"){
		updateRecords(userid);
		//askReferral(response);
		askUserType(response);
	}
			


	else if (statusid == "reg-confirm" && userid == response.userProfile.id){
		
		if (joined[userid] && joined[userid].Validated == "Yes") {
			mainMenu(message,response);
		}
		else {
			checkId(userid);
			const txt = "Unfortunately, your registration is not yet validated. I am "+botName+" Bot, your awesome Real Estate bot and I hope to be of service to you soon!";
			response.send(new TextMessage(txt,checkKb,null,null,null,3),td);
		}
	}
	//Consent
	else if ((text == "JOIN" || text == "Proceed") && statusid == "accepted" && userid == response.userProfile.id){
		//console.log("hello " + joined[userid]+"\n\n\n\n\n\n\n\n\n\n\n\n\n\n");
		if(td.userinfo){
			joined[userid] = td.userinfo;
		}
		if(joined[userid]){
			if (joined[userid]["Validated"] == "Yes") {
				td.groupType = joined[userid].Group;
				td.nameReg = joined[userid].Name;
				td.subGroup = joined[userid]["Sub Group"];
				td.statusid = "registered";
				
				console.log(joined[userid])
				let group = "";
				if(td.subGroup == "PRC"){
					group = "PRC Licensed Broker";
				} else if(td.subGroup == "HLURB"){
					group = "HLURB/PRC Accredited Broker";	
				} else if(td.subGroup == "Client"){
					group = "Client";
				} else{
					group = "ADMIN";
				}
				//let group = td.groupType == "Broker" ? joined[userid].Group + " with " + joined[userid]["Sub Group"] + " Accrediatation" : joined[userid].Group;
				const txt = `We detected that you previously registered as ${td.nameReg} as ${group}. Do you wish to register again or proceed with the Main Menu? Registering again will delete your old record.`;
				response.send(new TextMessage(txt,bypassKb,null,null,null,3),td);
			} else {
				checkId(userid);
				td.statusid = "reg-confirm";
				const txt = "Unfortunately, your registration is not yet validated. I am "+botName+" Bot, your awesome Real Estate bot and I hope to be of service to you soon!";
				response.send(new TextMessage(txt,checkKb,null,null,null,3),td);
			}
		} else {
			//console.log("Pumasok Dito")
			// const keyboard_referral = {
			// 	"Type": "keyboard",
			// 	"Buttons": [{
			// 		"Text": "<font color=\"#494E67\"><b>I don't have one.</b></font>",
			// 		//"TextSize": "medium",
			// 		//"TextHAlign": "center",
			// 		//"TextVAlign": "middle",
			// 		"ActionType": "reply",
			// 		"ActionBody": "no referral",
			// 		"BgColor": "#edbf80",
			// 		"Rows": 1,
			// 		"Columns": 6
			// 	}]
			// };
			// const txt = "Unfortunately, you are not yet registered. We will now proceed to your registration process.";
			// response.send(new TextMessage(txt,null,null,null,3),{ 
			// 	statusid: "referral",
			// 	userid: response.userProfile.id,
			// 	//groupType: ID
			// });

			askUserType(response);
			//askReferral(response);
			
		}

	}

	//CANCEL INSIDE REGISTRATION
	
	
	/////////////////////////
	// REGISTRATION /////////
	/////////////////////////
	
	//With Referral 
	else if(text != 'no referral' && statusid == "referral" && userid == response.userProfile.id){
		
		getReferral(response,text);
		td.referral = text;
		td.statusid = "proceedReferral";
		
		response.send(new TextMessage("Please select PROCEED to confirm selection.", proceedKb, null,null,null,3),td);
	
	}
	//Name Registration (No referral)
	else if(text == 'no referral' && statusid == "referral" && userid == response.userProfile.id){
		td.referral = text;
		td.groupType = "Client";
		
		let txt = `Please type your name in <Last Name, First Name, MI> format. Example: Reyes, Jose, C`;
		
		td.statusid = "nameRegistration";
		response.send(new TextMessage(`You will now be registered as a Client. \n` + txt, startKb),td);
	}
	// Name Registration (With Referral)
	else if(statusid == "proceedReferral" && userid == response.userProfile.id){
		td.groupType = referral[userid];

		let txt = "";
		
		if (td.groupType == "Unknown") {
			const startKb2 = {
				"InputFieldState": "hidden",
				"Type": "keyboard",
				"Buttons": [{
					"Text": "<b><font color=\"#000000\">START AGAIN</font></b>",
					"ActionType": "reply",
					"ActionBody": "CANCEL1",
					"BgColor": "#FFAA88",
					"TextOpacity": 100,
					"Rows": 1,
					"Columns": 6
				}]
			};
			//txt = `We cannot find your referral code in our system. We will proceed with your registration as a Client.\n`;
			txt = `I'm so sorry but we cannot find your referral code in our system. Please try another referral code or ask for a referral code from our Admin.`
			//td.groupType = "Client";
			response.send(new TextMessage(txt, startKb2,null,null,null,4),td);
		}
		else {
			txt = `Woohoo! We will proceed with your registration as an NREA Member. `;
			txt = txt + `Please type your name in <Last Name, First Name, MI> format. Example: Reyes, Jose, C`;
			td.statusid = "nameRegistration";
			response.send(new TextMessage(txt, startKb),td);
		}
		
		
		//response.send(new TextMessage('We will now proceed to your registration process. Please type your name. <Last name, First Name MI>', cancelKb),{
		
	}
	//Mobile Number Registration
	else if(text && statusid == "nameRegistration" && userid == response.userProfile.id){
		if(text.includes(",")){
			let nameSplit = text.split(",");
			console.log(nameSplit.length);
			if(nameSplit[0].length > 1 && nameSplit[1].length > 1 && nameSplit.length == 3 ){
				td.statusid = "mobileRegistration";
				td.nameReg = nameSplit[0].trim() + ", " + nameSplit[1].trim() + " " + nameSplit[2].trim()
				response.send(new TextMessage('Please input your mobile number beginning with 09, e.g., 09XXXXXXXXX.',startKb),td)
				
			} else {
				response.send(new TextMessage('You have input an incorrect value for your Name. Please try to follow our format of <Last Name, First Name, MI>.',startKb),td)	
			}
		} else {
			response.send(new TextMessage('You have input an incorrect value for your Name. Please try to follow our format of <Last Name, First Name, MI>.',startKb),td)
		}
		
		
	}
	//Email Registration
	else if(text && statusid == "mobileRegistration" && userid == response.userProfile.id ){
		if((isNaN(text) == false ) && (text.length == 11)){
			td.statusid = "emailRegistration";
			td.mobileReg = text;
			response.send(new TextMessage('Please input your email address.', startKb),td)
		} else {
			response.send(new TextMessage('You have input an incorrect value for your Mobile number. Please try again.', startKb),td)
		} 
	}
	//Ask for license (for Brokers)
	else if(text && statusid == "emailRegistration" && userid == response.userProfile.id && message.trackingData.groupType == 'Broker'){
		askLicense(message,response);		
	}
	//PRC License Number (for Brokers with PRC)
	else if(text == "Yes PRC" && statusid == "askLicense" && userid == response.userProfile.id && message.trackingData.groupType == 'Broker'){
		td.statusid = "prcNumberRegistration";
		response.send(new TextMessage('Please input your PRC license number. Example: 18888',startKb),td)	
	}
	// //Date of expiration PRC (for Brokers with PRC)
	// else if(text && statusid == "prcNumberRegistration" && userid == response.userProfile.id && message.trackingData.groupType == 'Broker'){
	// 	if(isNaN(text) == false){
	// 		td.statusid = 'prcExpRegistration';
	// 		td.prcNumber = parseInt(text);
	// 		//response.send(new TextMessage('Great! When does it expire? MM/DD/YYYY Example: 05/25/2021',startKb),td);
	// 	} else {
	// 		response.send(new TextMessage(`You have input an invalid PRC number. Please try again.`,startKb),td)
	// 	}
			
	// }

	// // pareb boards 
	// else if(text && statusid == "prcExpRegistration" && userid == response.userProfile.id && message.trackingData.groupType == 'Broker'){		
	// 	if(isValidDate(text) == false){
	// 		response.send(new TextMessage('Uh oh, you have inputted an invalid date. Please try again in MM/DD/YYYY format. Example: 05/25/2021.',startKb),td);
	// 	} else {
	// 		td.statusid = 'prcBoardAffiliation';
	// 		td.prcExp = '12/21/2099';
	// 		response.send(new TextMessage(`Which chapter are you affiliated with?`, startKb),td);
	// 	}
	// }
	else if(text && statusid == "prcNumberRegistration" && userid == response.userProfile.id && message.trackingData.groupType == 'Broker'){
		if(isNaN(text) == false){
			td.prcNumber = parseInt(text);
			td.statusid = 'prcBoardAffiliation';
			td.prcExp = '12/21/2099';
			response.send(new TextMessage(`Which chapter are you affiliated with?`, startKb),td);
		} else {
			response.send(new TextMessage(`You have input an invalid PRC number. Please try again.`,startKb),td)
		}
			
	}

	// separation of pareb boards using pages
	else if(text && statusid == "prcBoardAffiliation" && userid == response.userProfile.id && message.trackingData.groupType == 'Broker' && text == "BOARD1"){
		response.send(new TextMessage(`Which chapter are you affiliated with?`, startKb),td);
	}

	else if(text && statusid == "prcBoardAffiliation" && userid == response.userProfile.id && message.trackingData.groupType == 'Broker' && text == "BOARD2"){
		response.send(new TextMessage(`Which chapter are you affiliated with?`, startKb),td);
	}

	else if(text && statusid == "prcBoardAffiliation" && userid == response.userProfile.id && message.trackingData.groupType == 'Broker' && text == "BOARD3"){
		response.send(new TextMessage(`Which chapter are you affiliated with?`, startKb),td);
	}

	else if(text && statusid == "prcBoardAffiliation" && userid == response.userProfile.id && message.trackingData.groupType == 'Broker' && text == "BOARD4"){
		response.send(new TextMessage(`Which chapter are you affiliated with?`, startKb),td);
	}

	else if(text && statusid == "prcBoardAffiliation" && userid == response.userProfile.id && message.trackingData.groupType == 'Broker' && text == "BOARD5"){
		response.send(new TextMessage(`Which chapter are you affiliated with?`, startKb),td);
	}

	//Upload image of PRC License (for Brokers with PRC)
	// else if(text && statusid == "prcExpRegistration" && userid == response.userProfile.id && message.trackingData.groupType == 'Broker'){
	else if(text && statusid == "prcBoardAffiliation" && userid == response.userProfile.id && message.trackingData.groupType == 'Broker' 
		&& (text != "BOARD1" && text != "BOARD2" && text != "BOARD3" && text != "BOARD4" && text != "BOARD5")){
		// if(isValidDate(text) == false){
		// 	response.send(new TextMessage('Uh oh, you have inputted an invalid date. Please try again in MM/DD/YYYY format. Example: 05/25/2021.',startKb),td);
		// } else {
		// 	td.statusid = 'prcImageRegistration'; 
		// 	td.prcExp = text;
		// 	response.send(new TextMessage('Please upload an image of your PRC Real Estate Broker ID.',startKb),td);
		// }
		// console.log("textsdadasd " + text)
		td.statusid = 'prcImageRegistration'; 
		td.boardAffiliation = text;
		// td.prcExp = text;
		response.send(new TextMessage('Please upload an image of your PRC Real Estate Broker ID or NREA Membership ID or any government.',startKb),td);
	}

	//REGISTRATION CONFIRMATION (for Brokers with PRC)
	else if(message.url && statusid == "prcImageRegistration" && userid == response.userProfile.id && message.trackingData.groupType == 'Broker'){
		console.log("asdasdqwgasd " + JSON.stringify(message))
		const text2 = "Name: " + message.trackingData.nameReg + ",\n" +
					"Contact Number: " + message.trackingData.mobileReg + ",\n" +
					"Email: " + message.trackingData.emailReg + ",\n" +
					"PRC Number: " + message.trackingData.prcNumber + ",\n" +
					// "PRC Expiration Date: " + message.trackingData.prcExp + ",\n" + 
					"Chapter Affiliation: " + message.trackingData.boardAffiliation ;
		td.statusid = "prcConfirmation";
		td.prcImage = message.url;
		td.subGroup = "PRC";
		response.send(new TextMessage('Before I send this to our database, I would like to ask for your confirmation that the following data is accurate. \n' + text2, confirmKb,null,null,null,4),td);
	}

	//END REGISTRATION (for Brokers with PRC)
	else if(text == "Proceed" && statusid == "prcConfirmation" && userid == response.userProfile.id && message.trackingData.groupType == 'Broker'){
		registrationBrokerPRC(message,response);
		td.statusid = "reg-confirm";
		//response.send(new TextMessage('Thank you for registering! We will contact you as soon as registration has been validated.', checkKb,null,null,null,4),td)	
	}
	//DHSUD Accreditation ID (for Brokers with DHSUD) (Non Nrea start)
	// else if(text == "Non NREA" && statusid == "askLicense" && userid == response.userProfile.id && message.trackingData.groupType == 'Broker'){
	// 	td.statusid = "hlurbNumberRegistration";
	// 	response.send(td)	
	// }
	// //DHSUD Broker Confirm
	// else if(statusid == "hlurbNumberRegistration" && userid == response.userProfile.id && message.trackingData.groupType == 'Broker'){
		
	// 	if(isNaN(text) == false){
	// 		td.statusid = "hlurbBrokerConfirmed";
	// 		td.hlurbNumber = 'NREA Member';
	// 		response.send(new TextMessage('Please continue if your broker has confirmed to have registered to '+botName+' Bot. Do not proceed if your broker hasn’t registered to '+botName+' Bot.',continueKb),td);
	// 	} else {
	// 		response.send(new TextMessage('You have input an invalid DHSUD Accreditation ID. Please try again.',startKb),td);
	// 	}	
		
	// }
	else if(text == "Non NREA" && statusid == "askLicense" && userid == response.userProfile.id && message.trackingData.groupType == 'Broker'){
		td.statusid = "hlurbBrokerConfirmed";
		td.hlurbNumber = 'NREA Member';
		response.send(new TextMessage('Please continue if your broker has confirmed to have registered to '+botName+' Bot. Do not proceed if your broker hasn’t registered to '+botName+' Bot.',continueKb),td);

	}
	//DHSUD Accreditation ID Expiration(for Brokers with DHSUD)
	// else if(text == "Continue" && statusid == "hlurbBrokerConfirmed" && userid == response.userProfile.id && message.trackingData.groupType == 'Broker'){	
	// 	if(isNaN(text) == false){
	// 		td.statusid = "hlurbExpRegistration";
	// 		td.hlurbNumber = parseInt(text);
	// 		response.send(new TextMessage('Great! When does it expire? MM/DD/YYYY Example: 05/25/2021',startKb),td);
	// 	} else {
	// 		response.send(new TextMessage('You have input an invalid DHSUD Accreditation ID. Please try again.',startKb),td);
	// 	}	
	// }
	//DHSUD Accreditation Supervisor(for Brokers with DHSUD)
	else if(statusid == "hlurbBrokerConfirmed" && userid == response.userProfile.id && message.trackingData.groupType == 'Broker'){
		let check = isValidDate('12/31/2021')
		if( check == false){
			response.send(new TextMessage('Uh oh, you have inputted an invalid date. Please try again in MM/DD/YYYY format. Example: 05/25/2021.',startKb),td);
		} else {
			td.statusid = "hlurbSupervisorRegistration";
			td.hlurbExp = text;
			response.send(new TextMessage('Who is your supervising registered broker? Please type his name in <Last Name, First Name, MI> format.',startKb),td);
		}	
	}
	//DHSUD Accreditation Supervisor's PRC License(for Brokers with DHSUD)
	else if(text && statusid == "hlurbSupervisorRegistration" && userid == response.userProfile.id && message.trackingData.groupType == 'Broker'){
		if(text.includes(",")){
			let nameSplit = text.split(",");
			console.log(nameSplit.length);
			if(nameSplit[0].length > 1 && nameSplit[1].length > 1 && nameSplit.length == 3 ){
				td.statusid = "hlurbSupervisorLicenseRegistration";
				td.hlurbSupervisor = nameSplit[0].trim() + ", " + nameSplit[1].trim() + " " + nameSplit[2].trim();
				response.send(new TextMessage(`Please input your supervising broker's PRC license number.`,startKb),td);
			} else {
				response.send(new TextMessage(`You have input an incorrect value for your supervisor's name. Please try to follow our format of <Last Name, First Name, MI>.`,startKb),td)	
			}
		} else {
			response.send(new TextMessage(`You have input an incorrect value for your supervisor's name. Please try to follow our format of <Last Name, First Name, MI>.`,startKb),td)
		}
	}
	//DHSUD Accreditation Image(for Brokers with DHSUD)
	else if(text && statusid == "hlurbSupervisorLicenseRegistration" && userid == response.userProfile.id && message.trackingData.groupType == 'Broker'){
		if(isNaN(text) == false){
			(async() => {
			try {
				const query = await airTablePRC.read({
					filterByFormula: `{PRC Number} = "${text}"`
				});
				if(query.length != 0){
					td.statusid = "hlurbImageRegistration";
					td.hlurbSupervisorLicense = parseInt(text);
					response.send(new TextMessage(`Please upload an image of your PRC Real Estate Broker ID (for brokers) or government ID (for non-broker NREA member).`,startKb),td);
				} else {
					response.send(new TextMessage(`I'm sorry. The PRC License Number you've sent us does not exist on our system. If you want to be a part of our group, please ask your supervisor to register as well. Thank you!`,startKb),td);
				}		
			} catch(e){
				console.error(e);
			}
		})();


			
		} else {
			response.send(new TextMessage(`You have input an invalid PRC License Number. Please try again.`,startKb),td);
		}	
	}
	//CONFIRMATION REGISTRATION (for Brokers with DHSUD Accreditation ID)
	else if(message.url && statusid == "hlurbImageRegistration" && userid == response.userProfile.id && message.trackingData.groupType == 'Broker'){
		const text2 = "Name: " + message.trackingData.nameReg + ",\n" +
				"Contact Number: " + message.trackingData.mobileReg + ",\n" +
				"Email: " + message.trackingData.emailReg + ",\n" +
				//"DHSUD Accreditation ID/ Company ID/ Valid Government ID: " + message.trackingData.hlurbNumber + ",\n" +
				"Supervisor: " + message.trackingData.hlurbSupervisor + ",\n" +
				"Supervisor's License No.: " + message.trackingData.hlurbSupervisorLicense;
		td.statusid = "hlurbConfirmation";
		td.hlurbImage = message.url;
		td.subGroup = "HLURB";
				
		response.send(new TextMessage('Before I send this to our database, I would like to ask for your confirmation that the following data is accurate. \n' + text2, confirmKb,null,null,null,4),td);	
	}
	//END REGISTRATION (for Brokers with DHSUD Accreditation ID)
	else if(text == "Proceed" && statusid == "hlurbConfirmation" && userid == response.userProfile.id){
		registrationBrokerHLURB(message,response);	
	}
	//A Broker with no License or HLURB
	else if(text == "No license" && statusid == "askLicense" && userid == response.userProfile.id && message.trackingData.groupType == 'Broker'){
		askNoLicense(message,response);
	}
	//Wishes to join without License or HLURB REGISTRATION CONFIRMATION
	else if(text == "Yes join" && statusid == "askNoLicense" && userid == response.userProfile.id && message.trackingData.groupType == 'Broker'){
		const text2 = "Name: " + message.trackingData.nameReg + "\n" +
			"Contact Number: " + message.trackingData.mobileReg + "\n" +
			"Email: " + message.trackingData.emailReg + "\n";
		td.statusid = "askNoLicenseConfirmation";
		td.subGroup = "JOIN";
		
		response.send(new TextMessage('Before I send this to our database, I would like to ask for your confirmation that the following data presented is right. \n' + text2,confirmKb,null,null,null,4),td);
	}
	//Wishes to join without License or HLURB
	else if(text == "Proceed" && statusid == "askNoLicenseConfirmation" && userid == response.userProfile.id && message.trackingData.groupType == 'Broker'){
		registrationBrokerNoLicense(message, response);
	}
	//CONFIRMATION REGISTRATION (for Clients)
	else if(text && statusid == "emailRegistration" && userid == response.userProfile.id && message.trackingData.groupType == 'Client'){
		const text2 = "Name: " + message.trackingData.nameReg + ",\n" +
			"Contact Number: " + message.trackingData.mobileReg + ",\n" +
			"Email: " + text + "\n" 
		td.statusid = "clientRegistration";
		td.emailReg = text;
		td.subGroup = "Client";
		
		response.send(new TextMessage('Before I send this to our database, I would like to ask for your confirmation that the following data presented is right. \n' + text2, confirmKb,null,null,null,4),td);
	}

	//END REGISTRATION (for Clients)
	else if(text == "Proceed" && statusid == "clientRegistration" && userid == response.userProfile.id && message.trackingData.groupType == 'Client'){
		registrationClient(message);
		td.statusid = "registered";
		response.send(new TextMessage('Thank you for registering! Please press the proceed button to view our services.', proceedKb,null,null,null,3),td)
	}
	

	/////////////////////////
	// END REGISTRATION /////
	/////////////////////////

	//MAIN MENU
	//After REGISTRATION (PRESSING PROCEED)
	else if(text == 'Proceed' && userid == response.userProfile.id && statusid == "registered"){
		referral[userid] = null;
		mainMenu(message,response);
	}

	/////////////////////////
	// START MAIN ENLIST ////
	/////////////////////////

	else if(text == 'My Number' && userid == response.userProfile.id && statusid == "mainMenu"){

		msg = new ContactMessage(JSON.stringify(response.userProfile), "09185181399")
		response.send(new ContactMessage(response.userProfile.name, "09185181399"),message.trackingData);
		console.log(msg.contactPhoneNumber+ " Phone number \n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n");
		
			
		

	}







	//Start Enlist
	else if(text == 'Enlist' && userid == response.userProfile.id && statusid == "mainMenu"){
		pictureSent[userid] = false;
		if(td.groupType == "Broker") {
			mainEnlistPropertyType(message,response);
		}
		else {
			mainEnlistStart(message,response);
		}

	}
	//Helping Property (for Client)
	else if(text == 'Enlist help' && userid == response.userProfile.id && statusid == "mainEnlistStart"){
		mainEnlistHelp(message,response);
	}
	//Helping Property (None of the Above Reply) (for Client)
	else if(text == 'None of the above' && userid == response.userProfile.id && statusid == "mainEnlistStart" && message.trackingData.groupType == "Client"){
		td.statusid = "mainEnlistStart";
		response.send(new TextMessage(`Please specify it.`),td);	
	}
	//Pressed Real Estate Broker but is grouped as CLIENT
	else if(text == 'Enlist broker' && userid == response.userProfile.id && statusid == "mainEnlistStart" && message.trackingData.groupType == "Client"){
		mainEnlistNotbroker(message, response);
	}
	//Wants to join Broker group
	else if(text == 'None broker join' && userid == response.userProfile.id && statusid == "mainEnlistNotBroker" && message.trackingData.groupType == "Client"){
		td.statusid = "mainMenu";
		response.send(new TextMessage(`Please register again using a valid referral code.`),td);
		mainMenu(message, response);
	}
	//None broker no
	else if(text == 'None broker no' && userid == response.userProfile.id && statusid == "mainEnlistNotBroker" && message.trackingData.groupType == "Client"){
		td.statusid = "mainMenu";
		response.send(new TextMessage(`We wish to see you again in another time. Thank you for your interest.`),td)
		mainMenu(message, response);
	}
	//For lease or for sale
	else if(text && text != 'Enlist help' && text != 'None of the above' && userid == response.userProfile.id && statusid == "mainEnlistStart"){
		mainEnlistPropertyType(message,response);
	}
	//Type of property
	else if(text && userid == response.userProfile.id && statusid == "mainEnlistPropertyType"){
		mainEnlistPropertyType2(message,response);
	}
	//Commercial Property Type (chosen)
	else if(text == "Commercial with Improvements" && userid == response.userProfile.id && statusid == "mainEnlistPropertyType2"){
		td.propertyType = text;
		response.send(new TextMessage(`What type of commercial property is it?`,commercialKb,null,null,null,4),td)
	}

	//Location of property
	else if(text && text != "Commercial with Improvements" && userid == response.userProfile.id && statusid == "mainEnlistPropertyType2"){
		td.statusid = "mainEnlistLocationRegion";
		if(td.propertyType == "Commercial with Improvements"){
			td.commercialType = text;	
		} else {
			td.propertyType = text;
		}

		var Buttons = [];
		var i = 0;
		for (var r in regions) {
			Buttons.push({
				
				"Columns": 3,
				"Rows": 1,
				"Text": `<font color=\"#494E67\"><b>${r}</b></font>`,
				"TextSize": "small",
				"TextHAlign": "center",
				"TextVAlign": "middle",
				"ActionType": "reply",
				"ActionBody": r,
				"BgColor": ((i % 4 == 0 || i % 4 == 3) ? "#c7b0e6" : "#edbf80"),
				
			});
			i = i + 1;
			
		}

		Buttons.push( 
			{
				"Text": "<b><font color=\"#000000\">GO BACK TO MAIN MENU</font></b>",
				"ActionType": "reply",
				"TextSize": "small",
				"ActionBody": "CANCEL2",
				"BgColor": "#ffaa88",
				"TextOpacity": 100,
				"Rows": 1,
				"Columns": i % 2 ? 3 : 6
			}
		

		)

		var locationKb_region = {
			"Type": "keyboard",
			"InputFieldState": "hidden",
			"Buttons": Buttons
		};

		response.send(new TextMessage(`Looking good! Tell me more about it. Where is the property located?`,locationKb_region,null,null,null,4),td);
	}
	
	else if(text && userid == response.userProfile.id && statusid == "mainEnlistLocationRegion"){
		td.statusid = "mainEnlistLocationCity";
		td.locationRegion = text;

		var Buttons = [];
		var i = 0;

		var arrayLength = regions[text].length;
		for (i = 0; i < arrayLength; i++) {
			
			Buttons.push({
				
				"Columns": 3,
				"Rows": 1,
				"Text": `<font color=\"#494E67\"><b>${regions[text][i]}</b></font>`,
				"TextSize": "small",
				"TextHAlign": "center",
				"TextVAlign": "middle",
				"ActionType": "reply",
				"ActionBody": regions[text][i],
				"BgColor": ((i % 4 == 0 || i % 4 == 3) ? "#c7b0e6" : "#edbf80"),
				
			});
			
		}

		Buttons.push( 
			{
				"Text": "<b><font color=\"#000000\">GO BACK TO MAIN MENU</font></b>",
				"ActionType": "reply",
				"TextSize": "small",
				"ActionBody": "CANCEL2",
				"BgColor": "#FFAA88",
				"TextOpacity": 100,
				"Rows": 1,
				"Columns": i % 2 ? 3 : 6
			}
		

		)

		var locationKb_city = {
			"Type": "keyboard",
			"InputFieldState": "hidden",
			"Buttons": Buttons
		};
		
		response.send(new TextMessage(`Which part of ${text} is it located?`,locationKb_city,null,null,null,4),td);
	}


	//Condominium name
	else if(text && userid == response.userProfile.id && statusid == "mainEnlistLocationCity"){
		//if (message.latitude && message.longitude){
		
		
		let txt;
			
		td.region = td.locationRegion;
		td.city = text;
		td.baranggay = "UNKNOWN";
		td.loc = `${td.region},${td.city}`;
		td.location = `${td.region},${td.city},${td.baranggay}`;

		switch (td.propertyType) {
			case "Residential Condo": 
				td.statusid = "mainEnlistCondominiumName";
				txt = "Please input the condominium name.";
				response.send(new TextMessage(txt, cancel2Kb),td);
				break;
			case "Residential House & Lot":
				td.statusid = "mainEnlistCondominiumName";
				txt = "Please input the village/area it is located.";
				response.send(new TextMessage(txt, cancel2Kb),td);
				break;
			case "Residential Vacant Lot":
				td.statusid = "mainEnlistFloorArea";
				txt = "Please input the village/area it is located.";
				response.send(new TextMessage(txt, cancel2Kb),td);
				break;
			case "Office Space":
				td.statusid = "mainEnlistRooms";
				txt = "Please input the building name.";
				response.send(new TextMessage(txt, cancel2Kb),td);
				break;
			case "Commercial with Improvements":
				td.statusid = "mainEnlistRooms";
				txt = "Please input the building name/area it is located.";
				response.send(new TextMessage(txt, cancel2Kb),td);
				break;
			case "Commercial Vacant Lot":
				td.statusid = "mainEnlistFloorArea";
				txt = "Please input the area it is located.";
				response.send(new TextMessage(txt, cancel2Kb),td);
				break;
			case "Industrial with Improvements":
				td.statusid = "mainEnlistRooms";
				txt = "Please input the industrial park/area it is located.";
				response.send(new TextMessage(txt, cancel2Kb),td);
				break;
			case "Industrial Vacant Lot":
				td.statusid = "mainEnlistFloorArea";
				txt = "Please input the industrial park/area it is located.";
				response.send(new TextMessage(txt, cancel2Kb),td);
				break;
			case "Raw Land":
				td.statusid = "mainEnlistFloorArea";
				txt = "Please input the area it is located.";
				response.send(new TextMessage(txt, cancel2Kb),td);
				break;
		}	

			

			
	}

		
	//Number of Rooms
	else if(text && userid == response.userProfile.id && statusid == "mainEnlistCondominiumName"){
		
		let txt; 
		console.log("INSIDE HERE!")
		switch (td.propertyType) {

			case "Residential Condo": 
				td.statusid = "mainEnlistRooms";
				td.condoName = text;
				txt = "Please input the number of rooms.";
				response.send(new TextMessage(txt, cancel2Kb),td);
				break;
			case "Residential House & Lot":
				td.statusid = "mainEnlistRooms";
				td.condoName = text;
				txt = "Please input the number of rooms.";
				response.send(new TextMessage(txt, cancel2Kb),td);
				break;
			case "Residential Vacant Lot":
				//txt = `This section is for the number of rooms. Since the property type is ${td.propertyType}, the number of rooms is N/A. Press Confirm to continue"`;
				//response.send(new TextMessage(txt, none2Kb,null,null,null,4),td);
				break;
			case "Commercial with Improvements":
				//txt = `This section is for the number of rooms. Since the property type is ${td.propertyType}, the number of rooms is N/A. Press Confirm to continue"`;
				//response.send(new TextMessage(txt, none2Kb,null,null,null,4),td);
				break; 
			case "Commercial Vacant Lot":
				//txt = `This section is for the number of rooms. Since the property type is ${td.propertyType}, the number of rooms is N/A. Press Confirm to continue"`;
				//response.send(new TextMessage(txt, none2Kb,null,null,null,4),td);
				break;
			case "Office Space":
				//txt = `This section is for the number of rooms. Since the property type is ${td.propertyType}, the number of rooms is N/A. Press Confirm to continue"`;
				//response.send(new TextMessage(txt, none2Kb,null,null,null,4),td);
				break;
			case "Industrial with Improvements":
				//txt = `This section is for the number of rooms. Since the property type is ${td.propertyType}, the number of rooms is N/A. Press Confirm to continue"`;
				//response.send(new TextMessage(txt, none2Kb,null,null,null,4),td);
				break; 
			case "Industrial Vacant Lot":
				//txt = `This section is for the number of rooms. Since the property type is ${td.propertyType}, the number of rooms is N/A. Press Confirm to continue"`;
				//response.send(new TextMessage(txt, none2Kb,null,null,null,4),td);
				break;
			case "Raw Land":
				//txt = `This section is for the number of rooms. Since the property type is ${td.propertyType}, the number of rooms is N/A. Press Confirm to continue"`;
				//response.send(new TextMessage(txt, none2Kb,null,null,null,4),td);
				break;
					
		}

		
	}

	//Floor Area
	else if(text && userid == response.userProfile.id && statusid == "mainEnlistRooms"){
		
		console.log(text);
			let txt;
			switch (td.propertyType) {
				case "Residential Condo":
					text = text.split(",").join("");
					// if((isNaN(text) == false && Math.sign(text) == 1 && text != 0) || text == 'None'){
					if((isNaN(text) == false && Math.sign(text) >= 0 && text >= 0) || text == 'None'){
						td.statusid = "mainEnlistLotArea";
						td.rooms = text;
						txt = `Please input the floor area in square meters.`;
						response.send(new TextMessage(txt, cancel2Kb),td);
					} else {
						response.send(new TextMessage(`You have input an incorrect value for the number of room. I only accept numbers.`,cancel2Kb),td);
					}
					
					break;
				case "Residential House & Lot":
						text = text.split(",").join("");	
					if((isNaN(text) == false && Math.sign(text) >= 0 && text >= 0) || text == 'None'){
						td.statusid = "mainEnlistFloorArea";
						td.rooms = text;
						txt = `Please input the floor area in square meters.`;
						response.send(new TextMessage(txt, cancel2Kb),td);
					} else {
						response.send(new TextMessage(`You have input an incorrect value for the number of room. I only accept numbers.`,cancel2Kb),td);
					}
					break; 
				case "Commercial with Improvements":
					td.statusid = "mainEnlistFloorArea";
					td.condoName = text;
					txt = `Please input the floor area in square meters.`;
					response.send(new TextMessage(txt, cancel2Kb),td);
					break;
				case "Office Space":
					td.statusid = "mainEnlistLotArea";
					td.condoName = text;
					txt = `Please input the floor area in square meters.`;
					response.send(new TextMessage(txt, cancel2Kb),td);
					break;
				case "Industrial with Improvements":
					td.statusid = "mainEnlistFloorArea";
					td.condoName = text;
					txt = `Please input the floor area in square meters.`;
					response.send(new TextMessage(txt, cancel2Kb),td);
					break;
				case "Residential Vacant Lot":
					//txt = `This section is for the floor area. Since the property type is ${td.propertyType}, the floor area is N/A. Press Confirm to continue"`;
					//response.send(new TextMessage(txt, none2Kb,null,null,null,4),td);
					break;
				case "Commercial Vacant Lot":
					//txt = `This section is for the floor area. Since the property type is ${td.propertyType}, the floor area is N/A. Press Confirm to continue"`;
					//response.send(new TextMessage(txt, none2Kb,null,null,null,4),td);
					break;  
				case "Industrial Vacant Lot":
					//txt = `This section is for the floor area. Since the property type is ${td.propertyType}, the floor area is N/A. Press Confirm to continue"`;
					//response.send(new TextMessage(txt, none2Kb,null,null,null,4),td);
					break;
				case "Raw Land":
					//txt = `This section is for the floor area. Since the property type is ${td.propertyType}, the floor area is N/A. Press Confirm to continue"`;
					//response.send(new TextMessage(txt, none2Kb,null,null,null,4),td);
					break;
			}
	}
	//Lot Area
	else if(text && userid == response.userProfile.id && statusid == "mainEnlistFloorArea"){
		//text = text.split(",").join("");
		
			let txt;
			switch (td.propertyType) {
				case "Residential Condo":
					//txt = `This section is for the lot area. Since the property type is ${td.propertyType}, the lot area is N/A. Press Confirm to continue"`;
					//response.send(new TextMessage(txt,none2Kb),td);
					break;
				case "Office Space": 
					//txt = `This section is for the lot area. Since the property type is ${td.propertyType}, the lot area is N/A. Press Confirm to continue"`;
					//response.send(new TextMessage(txt,none2Kb),td);
					break;
				case "Residential House & Lot":
					text = text.split(",").join("");
					if((isNaN(text) == false && Math.sign(text) == 1 && text != 0) || text == 'None'){
						td.statusid = "mainEnlistLotArea";
						td.floorArea = text;
						txt = `Please input the lot area in square meters.`;
						response.send(new TextMessage(txt,cancel2Kb),td);
					} else {
						response.send(new TextMessage(`You have input an incorrect value for your floor area. I only accept numbers.`,cancel2Kb),td);
					}
					break;
				case "Commercial with Improvements":
					text = text.split(",").join("");
					if((isNaN(text) == false && Math.sign(text) == 1 && text != 0) || text == 'None'){
						td.statusid = "mainEnlistFurnishing";
						td.floorArea = text;
						txt = `Please input the lot area in square meters.`;
						response.send(new TextMessage(txt,cancel2Kb),td);
					} else {
						response.send(new TextMessage(`You have input an incorrect value for your floor area. I only accept numbers.`,cancel2Kb),td);
					}
					break;
				case "Industrial with Improvements":
					text = text.split(",").join("");	
					if((isNaN(text) == false && Math.sign(text) == 1 && text != 0) || text == 'None'){
						td.statusid = "mainEnlistParking";
						td.floorArea = text;
						txt = `Please input the lot area in square meters.`;
						response.send(new TextMessage(txt,cancel2Kb),td);
					} else {
						response.send(new TextMessage(`You have input an incorrect value for your floor area. I only accept numbers.`,cancel2Kb),td);
					}
					break;
				case "Residential Vacant Lot":
					td.statusid = "mainEnlistParking";
					td.condoName = text;
					txt = `Please input the lot area in square meters.`;
					response.send(new TextMessage(txt,cancel2Kb),td);
					break;
				case "Commercial Vacant Lot":
					td.statusid = "mainEnlistParking";
					td.condoName = text;
					txt = `Please input the lot area in square meters.`;
					response.send(new TextMessage(txt,cancel2Kb),td);
					break; 
				case "Industrial Vacant Lot":
					td.statusid = "mainEnlistParking";
					td.condoName = text;
					txt = `Please input the lot area in square meters.`;
					response.send(new TextMessage(txt,cancel2Kb),td);
					break;
				case "Raw Land":
					td.statusid = "mainEnlistParking";
					td.condoName = text;
					txt = `Please input the lot area in square meters.`;
					response.send(new TextMessage(txt,cancel2Kb),td);
					break;
			}
		
		
	}
	//Furnishings
	else if(text && userid == response.userProfile.id && statusid == "mainEnlistLotArea"){
		mainEnlistFurnishing(message,response);
	}

	//Parking Slots
	else if(text && userid == response.userProfile.id && statusid == "mainEnlistFurnishing"){		
		td.statusid = "mainEnlistParking";
		
		let txt;
		switch (td.propertyType) {
			case "Residential Condo":
				txt = `Does it have parking slots?`;
				td.furnishing = text;
				response.send(new TextMessage(txt, yesnoKb,null,null,null,4),td);
				break;
			case "Office Space":
				txt = `Does it have parking slots?`;
				td.furnishing = text;
				response.send(new TextMessage(txt, yesnoKb,null,null,null,4),td);
				break; 
			case "Commercial with Improvements": 
				text = text.split(",").join("");
				if((isNaN(text) == false && Math.sign(text) == 1 && text != 0) || text == 'None'){
					txt = `Does it have parking slots?`;
					td.lotArea = text;
					response.send(new TextMessage(txt, yesnoKb,null,null,null,4),td);
				} else {
					response.send(new TextMessage(`You have input an incorrect value for your Lot Area. I only accept numbers.`,cancel2Kb, null,null,null,4),td);
				}
				break;
			case "Residential House & Lot":
				//txt = `This section is for the parking slots. Since the property type is ${td.propertyType}, the parking slots is N/A. Press Confirm to continue"`;
				//response.send(new TextMessage(txt,none2Kb, null,null,null,4),td);
				break;
			case "Industrial with Improvements":
				//txt = `This section is for the parking slots. Since the property type is ${td.propertyType}, the parking slots is N/A. Press Confirm to continue"`;
				//response.send(new TextMessage(txt,none2Kb, null,null,null,4),td);
				break;
			case "Residential Vacant Lot":
				//txt = `This section is for the parking slots. Since the property type is ${td.propertyType}, the parking slots is N/A. Press Confirm to continue"`;
				//response.send(new TextMessage(txt,none2Kb, null,null,null,4),td);
				break;
			case "Commercial Vacant Lot":
				//txt = `This section is for the parking slots. Since the property type is ${td.propertyType}, the parking slots is N/A. Press Confirm to continue"`;
				//response.send(new TextMessage(txt,none2Kb, null,null,null,4),td);
				break; 
			case "Industrial Vacant Lot":
				//txt = `This section is for the parking slots. Since the property type is ${td.propertyType}, the parking slots is N/A. Press Confirm to continue"`;
				//response.send(new TextMessage(txt,none2Kb, null,null,null,4),td);
				break;
			case "Raw Land":
				//txt = `This section is for the parking slots. Since the property type is ${td.propertyType}, the parking slots is N/A. Press Confirm to continue"`;
				//response.send(new TextMessage(txt,none2Kb, null,null,null,4),td);
				break;
		}		
	}

	//Selling price
	else if(text && userid == response.userProfile.id && statusid == "mainEnlistParking"){
		
		switch (td.propertyType) {
			case "Residential Condo":
				td.statusid = "mainEnlistPrice";
				if(text == "Yes"){
					td.parkingSlots = "With Parking"
				} else if(text == "No") {
					td.parkingSlots = "Without Parking"
				}
				if (message.trackingData.property == "For Sale")
					response.send(new TextMessage(`How much is the selling price?`,cancel2Kb),td);
				else
					response.send(new TextMessage(`How much is the rental price?`,cancel2Kb),td);
				break;
			case "Office Space":
				td.statusid = "mainEnlistPrice";
				if(text == "Yes"){
					td.parkingSlots = "With Parking"
				} else if(text == "No") {
					td.parkingSlots = "Without Parking"
				}
				if (message.trackingData.property == "For Sale")
					response.send(new TextMessage(`How much is the selling price?`,cancel2Kb),td);
				else
					response.send(new TextMessage(`How much is the rental price?`,cancel2Kb),td);	
				break; 
			case "Commercial with Improvements":
				td.statusid = "mainEnlistPrice"; 
				if(text == "Yes"){
					td.parkingSlots = "With Parking"
				} else if(text == "No") {
					td.parkingSlots = "Without Parking"
				}
				if (message.trackingData.property == "For Sale")
					response.send(new TextMessage(`How much is the selling price?`,cancel2Kb),td);
				else
					response.send(new TextMessage(`How much is the rental price?`,cancel2Kb),td);
				break;
			case "Residential House & Lot":
				td.statusid = "mainEnlistPrice";
				td.furnishing = text;
				if (message.trackingData.property == "For Sale")
					response.send(new TextMessage(`How much is the selling price?`,cancel2Kb),td);
				else
					response.send(new TextMessage(`How much is the rental price?`,cancel2Kb),td);
				break;
			case "Industrial with Improvements":
				text = text.split(",").join("");
				if((isNaN(text) == false && Math.sign(text) == 1 && text != 0) || text == 'None'){
					td.statusid = "mainEnlistPrice";
					td.lotArea = text;
					if (message.trackingData.property == "For Sale")
						response.send(new TextMessage(`How much is the selling price?`,cancel2Kb),td);
					else
						response.send(new TextMessage(`How much is the rental price?`,cancel2Kb),td);
				} else {
					response.send(new TextMessage(`You have input an incorrect value for your Lot Area. I only accept numbers.`,cancel2Kb, null,null,null,4),td);
				}
				break;
			case "Residential Vacant Lot":
				text = text.split(",").join("");
				if((isNaN(text) == false && Math.sign(text) == 1 && text != 0) || text == 'None'){
					td.statusid = "mainEnlistPrice";
					td.lotArea = text;
					if (message.trackingData.property == "For Sale")
						response.send(new TextMessage(`How much is the selling price?`,cancel2Kb),td);
					else
						response.send(new TextMessage(`How much is the rental price?`,cancel2Kb),td);
				} else {
					response.send(new TextMessage(`You have input an incorrect value for your Lot Area. I only accept numbers.`,cancel2Kb, null,null,null,4),td);
				}	
				break;
			case "Commercial Vacant Lot":
				text = text.split(",").join("");
				if((isNaN(text) == false && Math.sign(text) == 1 && text != 0) || text == 'None'){
					td.statusid = "mainEnlistPrice";
					td.lotArea = text;
					if (message.trackingData.property == "For Sale")
						response.send(new TextMessage(`How much is the selling price?`,cancel2Kb),td);
					else
						response.send(new TextMessage(`How much is the rental price?`,cancel2Kb),td);
				} else {
					response.send(new TextMessage(`You have input an incorrect value for your Lot Area. I only accept numbers.`,cancel2Kb, null,null,null,4),td);
				}
				break; 
			case "Industrial Vacant Lot":
				text = text.split(",").join("");
				if((isNaN(text) == false && Math.sign(text) == 1 && text != 0) || text == 'None'){
					td.statusid = "mainEnlistPrice";
					td.lotArea = text;
					if (message.trackingData.property == "For Sale")
						response.send(new TextMessage(`How much is the selling price?`,cancel2Kb),td);
					else
						response.send(new TextMessage(`How much is the rental price?`,cancel2Kb),td);
				} else {
					response.send(new TextMessage(`You have input an incorrect value for your Lot Area. I only accept numbers.`,cancel2Kb, null,null,null,4),td);
				}
				break;
			case "Raw Land":
				text = text.split(",").join("");
				if((isNaN(text) == false && Math.sign(text) == 1 && text != 0) || text == 'None'){
					td.statusid = "mainEnlistPrice";
					td.lotArea = text;
					if (message.trackingData.property == "For Sale")
						response.send(new TextMessage(`How much is the selling price?`,cancel2Kb),td);
					else
						response.send(new TextMessage(`How much is the rental price?`,cancel2Kb),td);
				} else {
					response.send(new TextMessage(`You have input an incorrect value for your Lot Area. I only accept numbers.`,cancel2Kb, null,null,null,4),td);
				}
				break;
		}

		/*
		if (message.trackingData.property == "For sale")
			response.send(new TextMessage(`How much is the selling price?`,cancel2Kb),td);
		else
			response.send(new TextMessage(`How much is the rental price?`,cancel2Kb),td);
		*/
	
	}
/*
	//Rental Price
	else if(text && userid == response.userProfile.id && statusid == "mainEnlistParking" && message.trackingData.property == "For lease"){
		if(isNaN(text.split(",").join("")) == false || text == 'None'){	
			td.statusid = "mainEnlistPrice";
			td.parkingSlots = text;
			response.send(new TextMessage(`How much is the rental price?`,cancel2Kb),td);
		} else {
			response.send(new TextMessage(`You have input an incorrect value for Parking Slots. Please try again.`,cancel2Kb),td);
		}
	}
*/
	//Images of the Property
	else if(text && userid == response.userProfile.id && statusid == "mainEnlistPrice" && pictureSent[userid] == false){
		text = text.split(",").join("");
		if((isNaN(text) == false && Math.sign(text) == 1 && text != 0) || text == 'None'){
			if(message.trackingData.property == "For Sale") {
				if (parseInt(text) >= 250000){ 
					td.statusid = "mainEnlistPictures";
					td.price = text;
					td.propertyImage = ["null","null","null","null","null"];
					imageCount[userid] = 0;
					imageStore[userid] = ["null","null","null","null","null"];
					response.send(new TextMessage(`Please upload your photos. You may upload up to 5 photos. When you are finished, please press Continue.`,cancel2Kb),td);
				} else {
					response.send(new TextMessage(`You may have entered a per sqm price. Please enter total property price.`,cancel2Kb),td);
				}
			} else {
				td.statusid = "mainEnlistPictures";
				td.price = text;
				td.propertyImage = ["null","null","null","null","null"];
				imageCount[userid] = 0;
				imageStore[userid] = ["null","null","null","null","null"];
				response.send(new TextMessage(`Please upload your photos. You may upload up to 5 photos. When you are finished, please press Continue.`,cancel2Kb),td);
			}
		} else {
			response.send(new TextMessage(`You have input an incorrect value for Price. Please try again.`,cancel2Kb),td);
		}
	}
	//Multiple Image Handler
	else if(text != "Continue" && text != "Yes" && userid == response.userProfile.id && statusid == "mainEnlistPictures" && pictureSent[userid] == false){
		//console.log(pictureSent[userid])
		if((message.url && text == null) || text == "No") {
			if(imageCount[userid] < 5){
				if(message.url){
					imageStore[userid][imageCount[userid]] = message.url;
					imageCount[userid] = imageCount[userid]+1;
					message.trackingData.propertyImage = imageStore[userid];
					//console.log(message.trackingData.propertyImage);
				}
				td.propertyImage = imageStore[userid];
				const txt = `You have uploaded Photo # ${imageCount[userid]}`;
				response.send(new TextMessage(txt,continueKb),td);
				//response.send(new KeyboardMessage(continueKb), td);
			} else {
				response.send(new TextMessage(`You have already uploaded 5 photos. Please press 'CONTINUE' to proceed to the next step.`,continueKb),td);
			}
		} else {
			if(imageCount[userid] == 0){
				response.send(new TextMessage(`You have sent an invalid photo. Please try again.`,cancel2Kb),td);
			} else {
				response.send(new TextMessage(`You have sent an invalid photo. Please try again.`,continueKb),td);
			}
		}
	}

	//Special Status for Image Handler
	else if (pictureSent[userid] == true && message.trackingData.statusid == "mainEnlistPictures"){
		console.log("Pumasok Here")
		//break		
	}

	//Confirmation of amount of picture
	else if(text == "Continue" && imageCount[userid] > 0 && userid == response.userProfile.id && statusid == "mainEnlistPictures" && imageCount[userid] < 5){
		td.propertyImage = imageStore[userid];
		response.send(new TextMessage(`You only have uploaded ${imageCount[userid]} photo/s. Are you sure you want to continue?`,yesnoKb,null,null,null,4),td);
	}
	

	//Add details
	else if((text == "Continue" || text == "Yes") && imageCount[userid] > 0 && userid == response.userProfile.id && statusid == "mainEnlistPictures"){
		pictureSent[userid] = true
		td.propertyImage = imageStore[userid];
		td.statusid = "mainAskDetail";
		response.send(new TextMessage(`You can also add details about this property. Limited up to 200 characters.`,noneKb),td);
	}

	//Commision Rate (for Broker)
	else if(text && userid == response.userProfile.id && statusid == "mainAskDetail" && message.trackingData.groupType == 'Broker'){
		if(text.length <= 200){
			td.statusid = "mainEnlistCommission";
			td.propertyDetail = text.replace(/\n/g," ");
			if(td.property == "For Sale"){
				response.send(new TextMessage(`What is the commission rate in %? Example: 5`,cancel2Kb),td);
			} else {
				response.send(new TextMessage(`The property entered is for lease, it is standard to have the commission based on one month rental for one year of lease. Would you like to confirm this to proceed to the next step?`,confirm2Kb,null,null,null,4),td);
			}
		} else {
			var numOfCharExceeded = text.length - 200;
			// response.send(new TextMessage(`The property details you have provided exceeded the 200 character limit. Please make adjustments to save your property details.`,noneKb),td);
			response.send(new TextMessage(`The property details you have provided exceeded ${numOfCharExceeded} of characters (maximum number of characters is 200). Please make adjustments to save your property details.`,noneKb),td);
		}
		
	}

	//CONFIRMATION OF ENLIST (for Broker)
	else if(text && userid == response.userProfile.id && statusid == "mainEnlistCommission"){
		let commission = "";
		if(text != "Confirm"){
			commission = "Commission Rate: "+ text + "\n";	
		}
		text = text.split(",").join("");
		if((isNaN(text) == false && Math.sign(text) == 1 && text != 0 && parseInt(text) <= 100) || text == 'None' || text == 'Confirm'){
			let condoName = "";
			let floorArea = "";
			let lotArea = "";
			let rooms = "";
			let furnishing = "";
			let commercial = "";
			let parking = "";
			if(message.trackingData.condoName){
				switch (td.propertyType) {
					case "Residential Condo":
						condoName = "Condo Name: " + message.trackingData.condoName + "\n";
						break;
					case "Office Space":
						condoName = "Building Name: " + message.trackingData.condoName + "\n";
						break; 
					case "Commercial with Improvements": 
						condoName = "Building Name/Area: " + message.trackingData.condoName + "\n";
						break;
					case "Residential House & Lot":
						condoName = "Village/Area: " + message.trackingData.condoName + "\n";
						break;
					case "Industrial with Improvements":
						condoName = "Industrial Park/Area: " + message.trackingData.condoName + "\n";
						break;
					case "Residential Vacant Lot":
						condoName = "Village/Area: " + message.trackingData.condoName + "\n";
						break;
					case "Commercial Vacant Lot":
						condoName = "Area: " + message.trackingData.condoName + "\n";
						break; 
					case "Industrial Vacant Lot":
						condoName = "Industrial Park/Area: " + message.trackingData.condoName + "\n";
						break;
					case "Raw Land":
						condoName = "Area: " + message.trackingData.condoName + "\n";
						break;
				}		 
			}
			if(message.trackingData.floorArea){
				floorArea = "Floor Area: " + message.trackingData.floorArea + "\n";  
			}
			if(message.trackingData.lotArea){
				lotArea = "Lot Area: "+ message.trackingData.lotArea + "\n";  
			}
			if(message.trackingData.rooms){
				rooms = "Number of Rooms: " + message.trackingData.rooms + "\n";  
			}
			if(message.trackingData.furnishing){
				furnishing = "Furnishings: "+ message.trackingData.furnishing + "\n" 
			}
			if(message.trackingData.commercialType){
				commercial = "Commercial Type: "+ message.trackingData.commercialType + "\n" 
			}
			if(message.trackingData.parkingSlots){
				parking = "Parking: "+message.trackingData.parkingSlots + "\n"
			}
			

			const text2 = "Transaction: " + message.trackingData.property + "\n" +
						"Property Type: " + message.trackingData.propertyType + "\n" +
						commercial +
						"Location: " + message.trackingData.loc + "\n" +
						condoName +
						rooms +
						floorArea +
						lotArea +
						furnishing +
						parking +
						"Price: "  + message.trackingData.price + " Pesos\n" +
						"Property Detail: " + message.trackingData.propertyDetail + "\n" +
						commission;
			td.statusid = "mainEnlistBrokerConfirmation";
			if(text == "Confirm"){
				td.commissionRate = "For Lease";	
			}else {
				td.commissionRate = text;
			}	
			
			response.send(new TextMessage(`Before I send this to the database, I would like to ask for your confirmation to make sure that the following information to be stored is correct. \n` + text2, confirm2Kb,null,null,null,4),td);
		} else {
			response.send(new TextMessage(`You have input an incorrect value for Commission Rates. Please try again.`,cancel2Kb),td);
		}

	}
	// END OF ENLIST (for Broker)
	else if(text == "Confirm" && userid == response.userProfile.id && statusid == "mainEnlistBrokerConfirmation"){
		console.log(pictureSent[userid])
		mainEnlistBroker(message,response);
	}
	// ENLIST CONFIRMATION (for Client)
	else if(text && userid == response.userProfile.id && statusid == "mainAskDetail" && message.trackingData.groupType == 'Client'){
		if(text.length <= 200){
			
			let condoName = "";
			let floorArea = "";
			let lotArea = "";
			let rooms = "";
			let furnishing = "";
			let commercial = "";
			let parking = "";
			if(message.trackingData.condoName){
				switch (td.propertyType) {
					case "Residential Condo":
						condoName = "Condo Name: " + message.trackingData.condoName + "\n";
						break;
					case "Office Space":
						condoName = "Building Name: " + message.trackingData.condoName + "\n";
						break; 
					case "Commercial with Improvements": 
						condoName = "Building Name/Area: " + message.trackingData.condoName + "\n";
						break;
					case "Residential House & Lot":
						condoName = "Village/Area: " + message.trackingData.condoName + "\n";
						break;
					case "Industrial with Improvements":
						condoName = "Industrial Park/Area: " + message.trackingData.condoName + "\n";
						break;
					case "Residential Vacant Lot":
						condoName = "Village/Area: " + message.trackingData.condoName + "\n";
						break;
					case "Commercial Vacant Lot":
						condoName = "Area: " + message.trackingData.condoName + "\n";
						break; 
					case "Industrial Vacant Lot":
						condoName = "Industrial Park/Area: " + message.trackingData.condoName + "\n";
						break;
					case "Raw Land":
						condoName = "Area: " + message.trackingData.condoName + "\n";
						break;
				}  
			}
			if(message.trackingData.floorArea){
				floorArea = "Floor Area: " + message.trackingData.floorArea + "\n";  
			}
			if(message.trackingData.lotArea){
				lotArea = "Lot Area: "+ message.trackingData.lotArea + "\n";  
			}
			if(message.trackingData.rooms){
				rooms = "Number of Rooms: " + message.trackingData.rooms + "\n";  
			}
			if(message.trackingData.furnishing){
				furnishing = "Furnishings: "+ message.trackingData.furnishing + "\n" 
			}
			if(message.trackingData.commercialType){
				commercial = "Commercial Type: "+ message.trackingData.commercialType + "\n" 
			}
			if(message.trackingData.parkingSlots){
				parking = "Parking: "+message.trackingData.parkingSlots + "\n"
			}

			const text2 = "Transaction: " + message.trackingData.property + "\n" +
						"Property Type: " + message.trackingData.propertyType + "\n" +
						commercial +
						"Location: " + message.trackingData.loc + "\n" +
						condoName +
						rooms +
						floorArea +
						lotArea +
						furnishing +
						parking +
						"Price: "  + message.trackingData.price + " Pesos\n" +
						"Property Detail: " + text + "\n";
			td.statusid = "mainEnlistClientConfirmation";
			td.propertyDetail = text;
			response.send(new TextMessage(`Before I send this to the database, I would like to ask for your confirmation to make sure that the following information to be stored is correct. \n` + text2, confirm2Kb,null,null,null,4),td);

		} else {
			response.send(new TextMessage(`The property details you have provided exceeded the 200 character limit. Please make adjustments to save your property details.`,noneKb),td);
		}
	}

	// END OF ENLIST (for Client)
	else if(text == "Confirm" && userid == response.userProfile.id && statusid == "mainEnlistClientConfirmation"){
		mainEnlistClient(message,response);
		imageStore[userid] = null;
		imageCount[userid] = null;
	}

	/////////////////////
	// END OF ENLIST/////
	/////////////////////

	/////////////////////
	// START OF INQUIRE//
	/////////////////////
	//Main Inquire Start
	else if(text == 'Looking' && userid == response.userProfile.id && statusid == "mainMenu"){
		if(td.groupType == "Broker"){
			mainInquirePropertyType(message,response);
		}
		else {
			mainInquireStart(message,response);
		}
	}
	//Helping Property (INQUIRE)(for Client)
	else if(text == 'Inquire help' && userid == response.userProfile.id && statusid == "mainInquireStart"){
		mainInquireHelp(message,response);
	}
	//Helping Property (INQUIRE) (None of the Above Reply) (for Client)
	else if(text == 'None of the above' && userid == response.userProfile.id && statusid == "mainInquireStart" && message.trackingData.groupType == "Client"){
		response.send(new TextMessage(`Please specify it.`),td)	
	}
	//Pressed Real Estate Broker but is grouped as CLIENT (INQUIRE)
	else if(text == 'Inquire broker' && userid == response.userProfile.id && statusid == "mainInquireStart" && message.trackingData.groupType == "Client"){
		mainInquireNotbroker(message, response);
	}
	//Wants to join Broker group (INQUIRE)
	else if(text == 'None broker join' && userid == response.userProfile.id && statusid == "mainInquireNotBroker" && message.trackingData.groupType == "Client"){
		td.statusid = "mainMenu";
		response.send(new TextMessage(`We will reach out to you on how to join as a Broker.`),td);
		mainMenu(message, response);
	}
	//None broker no (INQUIRE)
	else if(text == 'None broker no' && userid == response.userProfile.id && statusid == "mainInquireNotBroker" && message.trackingData.groupType == "Client"){
		td.statusid = "mainMenu";
		response.send(new TextMessage(`We wish to see you again in another time. Thank you for your interest.`),td);
		mainMenu(message, response);
	}
	
	//To buy or To lease (INQUIRE)
	else if(text && text != 'Inquire help' && text != 'None of the above' && userid == response.userProfile.id && statusid == "mainInquireStart"){
		mainInquirePropertyType(message,response);
	}
	//Type of property (INQUIRE)
	else if(text && userid == response.userProfile.id && statusid == "mainInquirePropertyType"){
		mainInquirePropertyType2(message,response);
	}

	//Commercial Property Type (chosen)
	else if(text == "Commercial with Improvements" && userid == response.userProfile.id && statusid == "mainInquirePropertyType2"){
		td.propertyType = text;
		response.send(new TextMessage(`What type of commercial property is it?`,commercialKb,null,null,null,4),td)
	}
	
	
	//Location of property
	else if(text && text != "Commercial with Improvements" && userid == response.userProfile.id && statusid == "mainInquirePropertyType2"){
		td.statusid = "mainInquireLocationRegion";
		if(td.propertyType == "Commercial with Improvements"){
			td.commercialType = text	
		} else {
			td.propertyType = text;
		}

		var Buttons = [];
		var i = 0;
		for (var r in regions) {
			Buttons.push({
				
				"Columns": 3,
				"Rows": 1,
				"Text": `<font color=\"#494E67\"><b>${r}</b></font>`,
				"TextSize": "small",
				"TextHAlign": "center",
				"TextVAlign": "middle",
				"ActionType": "reply",
				"ActionBody": r,
				"BgColor": ((i % 4 == 0 || i % 4 == 3) ? "#c7b0e6" : "#edbf80"),
				
			});
			i = i + 1;
			
		}

		Buttons.push( 
			{
				"Text": "<b><font color=\"#000000\">GO BACK TO MAIN MENU</font></b>",
				"ActionType": "reply",
				"TextSize": "small",
				"ActionBody": "CANCEL2",
				"BgColor": "#ffaa88",
				"TextOpacity": 100,
				"Rows": 1,
				"Columns": i % 2 ? 3 : 6
			}
		

		)

		var locationKb_region = {
			"Type": "keyboard",
			"InputFieldState": "hidden",
			"Buttons": Buttons
		};

		
		response.send(new TextMessage(`Looking good! Tell me the general area where the property is located.`, locationKb_region,null,null,null,4),td);
	}

	else if(text && userid == response.userProfile.id && statusid == "mainInquireLocationRegion"){
		td.statusid = "mainInquireLocationCity";
		td.locationRegion = text;

		var Buttons = [];

		var arrayLength = regions[text].length;
		var i = 0;
		for (i = 0; i < arrayLength; i++) {
			
			Buttons.push({
				
				"Columns": 3,
				"Rows": 1,
				"Text": `<font color=\"#494E67\"><b>${regions[text][i]}</b></font>`,
				"TextSize": "small",
				"TextHAlign": "center",
				"TextVAlign": "middle",
				"ActionType": "reply",
				"ActionBody": regions[text][i],
				"BgColor": ((i % 4 == 0 || i % 4 == 3) ? "#c7b0e6" : "#edbf80"),
				
			});
			
		}

		Buttons.push( 
			{
				"Text": "<b><font color=\"#000000\">GO BACK TO MAIN MENU</font></b>",
				"ActionType": "reply",
				"TextSize": "small",
				"ActionBody": "CANCEL2",
				"BgColor": "#FFAA88",
				"TextOpacity": 100,
				"Rows": 1,
				"Columns": i % 2 ? 3 : 6
			}
		

		)

		var locationKb_city = {
			"Type": "keyboard",
			"InputFieldState": "hidden",
			"Buttons": Buttons
		};
		
		response.send(new TextMessage(`Which part of ${text} is it located?`,locationKb_city,null,null,null,4),td);
	}


	
	//Condominium name
	else if(text && userid == response.userProfile.id && statusid == "mainInquireLocationCity"){
		//if(message.latitude && message.longitude){

		const skipAllKb = {
			"Type": "keyboard",
			"Buttons": [{
				"Text": "<b><font color=\"#000000\">SKIP</font></b>",
				"ActionType": "reply",
				"ActionBody": "None",
				"BgColor": "#c7b0e6",
				"TextOpacity": 100,
				"Rows": 1,
				"Columns": 6,
				"Silent": "true"
			},{
				"Text": "<b><font color=\"#000000\">SKIP ALL</font></b>",
				"ActionType": "reply",
				"ActionBody": "SKIPALL",
				"BgColor": "#FFAA88",
				"TextOpacity": 100,
				"Rows": 1,
				"Columns": 6
			},{
				"Text": "<b><font color=\"#000000\">GO BACK TO MENU</font></b>",
				"ActionType": "reply",
				"ActionBody": "CANCEL2",
				"BgColor": "#c7b0e6",
				"TextOpacity": 100,
				"Rows": 1,
				"Columns": 6
			}]
		};

		let txt;
			
		td.region = td.locationRegion;
		td.city = text;
		td.baranggay = "ALL";
		td.loc = `${td.region},${td.city}`;
		td.location = `${td.region},${td.city},${td.baranggay}`;

		switch (td.propertyType) {
			case "Residential Condo": 
				td.statusid = "mainInquireCondominiumName";
				txt = "Please input a condominium name you prefer.";
				// response.send(new TextMessage(txt, cancel2Kb),td);
				// response.send(new TextMessage(txt, noneKb),td);
				response.send(new TextMessage(txt, skipAllKb),td);
				break;
			case "Residential House & Lot":
				td.statusid = "mainInquireCondominiumName";
				txt = "Please input the village/area you prefer. (Optional)";
				// response.send(new TextMessage(txt, noneKb),td);
				response.send(new TextMessage(txt, skipAllKb),td);
				break;
			case "Residential Vacant Lot":
				td.statusid = "mainInquireFloorAreaMax";
				txt = "Please input the village/area you prefer. (Optional)";
				// response.send(new TextMessage(txt, noneKb),td);
				response.send(new TextMessage(txt, skipAllKb),td);
				break;
			case "Commercial with Improvements":
				td.statusid = "mainInquireRooms";
				txt = "Please input the building name/area you prefer. (Optional)";
				// response.send(new TextMessage(txt, noneKb),td);
				response.send(new TextMessage(txt, skipAllKb),td);
				break;
			case "Commercial Vacant Lot":
				td.statusid = "mainInquireFloorAreaMax";
				txt = "Please input the area you prefer. (Optional)";
				// response.send(new TextMessage(txt, noneKb),td);
				response.send(new TextMessage(txt, skipAllKb),td);
				break;
			case "Office Space":
				td.statusid = "mainInquireRooms";
				txt = "Please input the building name you prefer. (Optional)";
				// response.send(new TextMessage(txt, noneKb),td);
				response.send(new TextMessage(txt, skipAllKb),td);
				break;
			case "Industrial with Improvements":
				td.statusid = "mainInquireRooms";
				txt = "Please input the industrial park/area you prefer. (Optional)";
				// response.send(new TextMessage(txt, noneKb),td);
				response.send(new TextMessage(txt, skipAllKb),td);
				break;
			case "Industrial Vacant Lot":
				td.statusid = "mainInquireFloorAreaMax";
				txt = "Please input the industrial park/area you prefer. (Optional)";
				// response.send(new TextMessage(txt, noneKb),td);
				response.send(new TextMessage(txt, skipAllKb),td);
				break;
			case "Raw Land":
				td.statusid = "mainInquireFloorAreaMax";
				txt = "Please input the area you prefer. (Optional)";
				// response.send(new TextMessage(txt, noneKb),td);
				response.send(new TextMessage(txt, skipAllKb),td);
				break;

			}

		
		
	} 

	// else if(text == "SKIPALL"){

	// 	const confirmSkipAllKb = {
	// 		"Type": "keyboard",
	// 		"InputFieldState": "hidden",
	// 		"Buttons": [{
	// 			"Text": "<b><font color=\"#000000\">Confirm</font></b>",
	// 			"ActionType": "reply",
	// 			"ActionBody": "None",
	// 			"TextOpacity": 100,
	// 			"Rows": 1,
	// 			"Columns": 6,
	// 			"BgColor": "#c7b0e6",
	// 		},{
	// 			"Text": "<b><font color=\"#000000\">GO BACK TO MAIN MENU</font></b>",
	// 			"ActionType": "reply",
	// 			"ActionBody": "CANCEL2",
	// 			"BgColor": "#FFAA88",
	// 			"TextOpacity": 100,
	// 			"Rows": 1,
	// 			"Columns": 6
	// 		}]
	// 	};

	// 	td.statusid = "mainInquireMaximumPrice";
	// 	txt = "You will receive broader search results if you skip all, do you confirm?";
	// 	response.send(new TextMessage(txt, confirmSkipAllKb),td);
	// }
	
	//Number of Rooms
	else if(text && userid == response.userProfile.id && statusid == "mainInquireCondominiumName" && text != "SKIPALL"){
		td.statusid = "mainInquireRooms";
		td.condoName = text;
		let txt; 
		switch (td.propertyType) {

			case "Residential Condo": 
				txt = "Please input the number of rooms.";
				// response.send(new TextMessage(txt, cancel2Kb),td);
				response.send(new TextMessage(txt, noneKb),td);
				break;
			case "Residential House & Lot":
				txt = "Please input the number of rooms.";
				// response.send(new TextMessage(txt, cancel2Kb),td);
				response.send(new TextMessage(txt, noneKb),td);
				break;
			case "Residential Vacant Lot":
				//txt = `This section is for the number of rooms. Since the property type is ${td.propertyType}, the number of rooms is N/A. Press Confirm to continue"`;
				//response.send(new TextMessage(txt, none2Kb,null,null,null,4),td);
				break;
			case "Commercial with Improvements":
				//txt = `This section is for the number of rooms. Since the property type is ${td.propertyType}, the number of rooms is N/A. Press Confirm to continue"`;
				//response.send(new TextMessage(txt, none2Kb,null,null,null,4),td);
				break; 
			case "Commercial Vacant Lot":
				//txt = `This section is for the number of rooms. Since the property type is ${td.propertyType}, the number of rooms is N/A. Press Confirm to continue"`;
				//response.send(new TextMessage(txt, none2Kb,null,null,null,4),td);
				break;
			case "Office Space":
				//txt = `This section is for the number of rooms. Since the property type is ${td.propertyType}, the number of rooms is N/A. Press Confirm to continue"`;
				//response.send(new TextMessage(txt, none2Kb,null,null,null,4),td);
				break;
			case "Industrial with Improvements":
				//txt = `This section is for the number of rooms. Since the property type is ${td.propertyType}, the number of rooms is N/A. Press Confirm to continue"`;
				//response.send(new TextMessage(txt, none2Kb,null,null,null,4),td);
				break; 
			case "Industrial Vacant Lot":
				//txt = `This section is for the number of rooms. Since the property type is ${td.propertyType}, the number of rooms is N/A. Press Confirm to continue"`;
				//response.send(new TextMessage(txt, none2Kb,null,null,null,4),td);
				break;
			case "Raw Land":
				//txt = `This section is for the number of rooms. Since the property type is ${td.propertyType}, the number of rooms is N/A. Press Confirm to continue"`;
				//response.send(new TextMessage(txt, none2Kb,null,null,null,4),td);
				break;
		}

	}

	//Floor Area (Min Area) 1
	else if(text && text != "CANCEL2" && userid == response.userProfile.id && statusid == "mainInquireRooms" && text != "SKIPALL"){
		
			
			
			let txt;
			switch (td.propertyType) {
				
				case "Residential Condo":
					text = text.split(",").join("")
					if((isNaN(text) == false && Math.sign(text) >= 0 && text >= 0) || text == 'None'){
						td.statusid = "mainInquireFloorAreaMin";
						td.rooms = text;
						txt = `Please input the minimum floor area in square meters.`;
						response.send(new TextMessage(txt, noneKb),td);
					} else {
						response.send(new TextMessage(`You have input an incorrect value for the number of rooms. Please try again.`,cancel2Kb),td);
					}
					break;
				case "Residential House & Lot":
					text = text.split(",").join("")
					if((isNaN(text) == false && Math.sign(text) >= 0 && text >= 0) || text == 'None'){
						td.statusid = "mainInquireFloorAreaMin";
						td.rooms = text;
						txt = `Please input the minimum floor area in square meters.`;
						response.send(new TextMessage(txt, noneKb),td);
					} else {
						response.send(new TextMessage(`You have input an incorrect value for the number of rooms. Please try again.`,cancel2Kb),td);
					}
					break; 
				case "Commercial with Improvements":
					td.statusid = "mainInquireFloorAreaMin";
					td.condoName = text;
					txt = `Please input the minimum floor area in square meters.`;
					response.send(new TextMessage(txt, noneKb),td);
					break;
				case "Office Space":
					td.statusid = "mainInquireFloorAreaMin";
					td.condoName = text;
					txt = `Please input the minimum floor area in square meters.`;
					response.send(new TextMessage(txt, noneKb),td);
					break;
				case "Industrial with Improvements":
					td.statusid = "mainInquireFloorAreaMin";
					td.condoName = text;
					txt = `Please input the minimum floor area in square meters.`;
					response.send(new TextMessage(txt, noneKb),td);
					break;
				case "Residential Vacant Lot":
					//txt = `This section is for the minimum floor area. Since the property type is ${td.propertyType}, the minimum floor area is N/A. Press Confirm to continue"`;
					//response.send(new TextMessage(txt, none2Kb,null,null,null,4),td);
					break;
				case "Commercial Vacant Lot":
					//txt = `This section is for the minimum floor area. Since the property type is ${td.propertyType}, the minimum floor area is N/A. Press Confirm to continue"`;
					//response.send(new TextMessage(txt, none2Kb,null,null,null,4),td);
					break;  
				case "Industrial Vacant Lot":
					//txt = `This section is for the minimum floor area. Since the property type is ${td.propertyType}, the minimum floor area is N/A. Press Confirm to continue"`;
					//response.send(new TextMessage(txt, none2Kb,null,null,null,4),td);
					break;
				case "Raw Land":
					//txt = `This section is for the minimum floor area. Since the property type is ${td.propertyType}, the minimum floor area is N/A. Press Confirm to continue"`;
					//response.send(new TextMessage(txt, none2Kb,null,null,null,4),td);
					break;
	
			}
		

	}

	//Floor Area (Max) 2
	else if(text && text != "CANCEL2" && userid == response.userProfile.id && statusid == "mainInquireFloorAreaMin"){
		text = text.split(",").join("")
		if((isNaN(text) == false && Math.sign(text) == 1 && text != 0) || text == 'None'){
			//td.statusid = "mainInquireFloorAreaMax";
			td.floorAreaMin = text;
			let txt;
			switch (td.propertyType) {

				case "Residential Condo":
					if(text == 'None'){
						td.statusid = "mainInquireLotAreaMax";
						// txt = `Please enter the maximum floor area in square meters. (Required)`;
						// response.send(new TextMessage(txt, cancel2Kb),td);
						txt = `Please enter the maximum floor area in square meters.`;
						response.send(new TextMessage(txt, noneKb),td);
					} else {
						td.statusid = "mainInquireLotAreaMax";
						txt = `Please enter the maximum floor area in square meters.`;
						response.send(new TextMessage(txt, noneKb),td);
					}
					break;
				case "Residential House & Lot":
					if(text == 'None'){
						td.statusid = "mainInquireFloorAreaMax";
						// txt = `Please enter the maximum floor area in square meters. (Required)`;
						// response.send(new TextMessage(txt, cancel2Kb),td);
						txt = `Please enter the maximum floor area in square meters.`;
						response.send(new TextMessage(txt, noneKb),td);
					} else {
						td.statusid = "mainInquireFloorAreaMax";
						txt = `Please enter the maximum floor area in square meters.`;
						response.send(new TextMessage(txt, noneKb),td);
					}
					break; 
				case "Commercial with Improvements":
					if(text == 'None'){
						td.statusid = "mainInquireFloorAreaMax";
						// txt = `Please enter the maximum floor area in square meters. (Required)`;
						// response.send(new TextMessage(txt, cancel2Kb),td);
						txt = `Please enter the maximum floor area in square meters.`;
						response.send(new TextMessage(txt, noneKb),td);
					} else {
						td.statusid = "mainInquireFloorAreaMax";
						txt = `Please enter the maximum floor area in square meters.`;
						response.send(new TextMessage(txt, noneKb),td);
					}
					break;
				case "Office Space":
					if(text == 'None'){
						td.statusid = "mainInquireLotAreaMax";
						// txt = `Please enter the maximum floor area in square meters. (Required)`;
						// response.send(new TextMessage(txt, cancel2Kb),td);
						txt = `Please enter the maximum floor area in square meters.`;
						response.send(new TextMessage(txt, noneKb),td);
					} else {
						td.statusid = "mainInquireLotAreaMax";
						txt = `Please enter the maximum floor area in square meters.`;
						response.send(new TextMessage(txt, noneKb),td);
					}
					break;
				case "Industrial with Improvements":
					if(text == 'None'){
						td.statusid = "mainInquireFloorAreaMax";
						// txt = `Please enter the maximum floor area in square meters. (Required)`;
						// response.send(new TextMessage(txt, cancel2Kb),td);
						txt = `Please enter the maximum floor area in square meters.`;
						response.send(new TextMessage(txt, noneKb),td);
					} else {
						td.statusid = "mainInquireFloorAreaMax";
						txt = `Please enter the maximum floor area in square meters.`;
						response.send(new TextMessage(txt, noneKb),td);
					}
					break;
				case "Residential Vacant Lot":
					//txt = `This section is for the maximum floor area. Since the property type is ${td.propertyType}, the maximum floor area is N/A. Press Confirm to continue"`;
					//response.send(new TextMessage(txt, none2Kb,null,null,null,4),td);
					break;
				case "Commercial Vacant Lot":
					//txt = `This section is for the maximum floor area. Since the property type is ${td.propertyType}, the maximum floor area is N/A. Press Confirm to continue"`;
					//response.send(new TextMessage(txt, none2Kb,null,null,null,4),td);
					break;  
				case "Industrial Vacant Lot":
					//txt = `This section is for the maximum floor area. Since the property type is ${td.propertyType}, the maximum floor area is N/A. Press Confirm to continue"`;
					//response.send(new TextMessage(txt, none2Kb,null,null,null,4),td);
					break;
				case "Raw Land":
					//txt = `This section is for the maximum floor area. Since the property type is ${td.propertyType}, the maximum floor area is N/A. Press Confirm to continue"`;
					//response.send(new TextMessage(txt, none2Kb,null,null,null,4),td);
					break;
			}
		} else {
			response.send(new TextMessage(`You have input an incorrect value for the minimum floor area. Please try again.`,cancel2Kb),td);
		}

	}

	//Lot Area Min (1)
	else if(text && userid == response.userProfile.id && statusid == "mainInquireFloorAreaMax" && text != "SKIPALL"){
		
			
			//td.floorAreaMax = text;
			let txt;
			//text = text.split(",").join("")
			switch (td.propertyType) {
				case "Residential Condo":
					//txt = `This section is for the minimum lot area. Since the property type is ${td.propertyType}, the minimum lot area is N/A. Press Confirm to continue"`;
					//response.send(new TextMessage(txt,none2Kb),td);
					break;
				case "Office Space": 
					//txt = `This section is for the minimum lot area. Since the property type is ${td.propertyType}, the minimum lot area is N/A. Press Confirm to continue"`;
					//response.send(new TextMessage(txt,none2Kb),td);
					break;
				case "Residential House & Lot":
					text = text.split(",").join("");
					if((isNaN(text) == false && Math.sign(text) == 1 && text != 0) || text == 'None'){
						td.statusid = "mainInquireLotAreaMin";
						td.floorAreaMax = text;
						txt = `Please input the minimum lot area in square meters.`;
						response.send(new TextMessage(txt,noneKb),td);
					} else {
						response.send(new TextMessage(`You have input an incorrect value for Maximum Floor Area. Please try again.`,cancel2Kb),td);
					}		
					break;
				case "Commercial with Improvements":
					text = text.split(",").join("");
					if((isNaN(text) == false && Math.sign(text) == 1 && text != 0) || text == 'None'){
						td.statusid = "mainInquireLotAreaMin";
						td.floorAreaMax = text;
						txt = `Please input the minimum lot area in square meters.`;
						response.send(new TextMessage(txt,noneKb),td);
					} else {
						response.send(new TextMessage(`You have input an incorrect value for Maximum Floor Area. Please try again.`,cancel2Kb),td);
					}
					break;
				case "Industrial with Improvements":
					text = text.split(",").join("");
					if((isNaN(text) == false && Math.sign(text) == 1 && text != 0) || text == 'None'){
						td.statusid = "mainInquireLotAreaMin";
						td.floorAreaMax = text;
						txt = `Please input the minimum lot area in square meters.`;
						response.send(new TextMessage(txt,noneKb),td);
					} else {
						response.send(new TextMessage(`You have input an incorrect value for Maximum Floor Area. Please try again.`,cancel2Kb),td);
					}
					break;
				case "Residential Vacant Lot":
					td.statusid = "mainInquireLotAreaMin";
					td.condoName = text;
					txt = `Please input the minimum lot area in square meters.`;
					response.send(new TextMessage(txt,noneKb),td);
					break;
				case "Commercial Vacant Lot":
					td.statusid = "mainInquireLotAreaMin";
					td.condoName = text;
					txt = `Please input the minimum lot area in square meters.`;
					response.send(new TextMessage(txt,noneKb),td);
					break; 
				case "Industrial Vacant Lot":
					td.statusid = "mainInquireLotAreaMin";
					td.condoName = text;
					txt = `Please input the minimum lot area in square meters.`;
					response.send(new TextMessage(txt,noneKb),td);
					break;
				case "Raw Land":
					td.statusid = "mainInquireLotAreaMin";
					td.condoName = text;
					txt = `Please input the minimum lot area in square meters.`;
					response.send(new TextMessage(txt,noneKb),td);
					break;
			}
		
	}

	//Lot Area Max (2)
	else if(text && userid == response.userProfile.id && statusid == "mainInquireLotAreaMin"){
		text = text.split(",").join("");
		if((isNaN(text) == false && Math.sign(text) == 1 && text != 0) || text == 'None'){
			//td.statusid = "mainInquireLotAreaMax";
			td.lotAreaMin = text;
			let txt;
			switch (td.propertyType) {
				case "Residential Condo":
					//txt = `This section is for the maximum lot area. Since the property type is ${td.propertyType}, the maximum lot area is N/A. Press Confirm to continue"`;
					//response.send(new TextMessage(txt,none2Kb),td);
					break;
				case "Office Space": 
					//txt = `This section is for the maximum lot area. Since the property type is ${td.propertyType}, the maximum lot area is N/A. Press Confirm to continue"`;
					//response.send(new TextMessage(txt,none2Kb),td);
					break;
				case "Industrial with Improvements":
					if(text == 'None'){
						// td.statusid = "mainInquireLotAreaMax";
						td.statusid = "mainInquireParking";
						// txt = `Please input the maximum lot area in square meters. (Required)`;
						// response.send(new TextMessage(txt, cancel2Kb),td);
						txt = `Please input the maximum lot area in square meters.`;
						response.send(new TextMessage(txt, noneKb),td);
					} else {
						// td.statusid = "mainInquireLotAreaMax";
						td.statusid = "mainInquireParking";
						txt = `Please input the maximum lot area in square meters.`;
						response.send(new TextMessage(txt, noneKb),td);
					}
					break;
				case "Residential House & Lot":
					if(text == 'None'){
						// td.statusid = "mainInquireLotAreaMax";
						td.statusid = "mainInquireParking";
						// txt = `Please input the maximum lot area in square meters. (Required)`;
						// response.send(new TextMessage(txt, cancel2Kb),td);
						txt = `Please input the maximum lot area in square meters.`;
						response.send(new TextMessage(txt, noneKb),td);
					} else {
						// td.statusid = "mainInquireLotAreaMax";
						td.statusid = "mainInquireParking";
						txt = `Please input the maximum lot area in square meters.`;
						response.send(new TextMessage(txt, noneKb),td);
					}
					break;
				case "Commercial with Improvements":
					td.statusid = "mainInquireParking";
					if(text == 'None'){
						// td.statusid = "mainInquireFurnishing";
						// txt = `Please input the maximum lot area in square meters. (Required)`;
						// response.send(new TextMessage(txt, cancel2Kb),td);
						txt = `Please input the maximum lot area in square meters.`;
						response.send(new TextMessage(txt, noneKb),td);
					} else {
						// td.statusid = "mainInquireFurnishing";
						txt = `Please input the maximum lot area in square meters.`;
						response.send(new TextMessage(txt, noneKb),td);
					}
					break;
				case "Residential Vacant Lot":
					if(text == 'None'){
						td.statusid = "mainInquireParking";
						// txt = `Please input the maximum lot area in square meters. (Required)`;
						// response.send(new TextMessage(txt, cancel2Kb),td);
						txt = `Please input the maximum lot area in square meters.`;
						response.send(new TextMessage(txt, noneKb),td);
					} else {
						td.statusid = "mainInquireParking";
						txt = `Please input the maximum lot area in square meters.`;
						response.send(new TextMessage(txt, noneKb),td);
					}
					break;
				case "Commercial Vacant Lot":
					if(text == 'None'){
						td.statusid = "mainInquireParking";
						// txt = `Please input the maximum lot area in square meters. (Required)`;
						// response.send(new TextMessage(txt, cancel2Kb),td);
						txt = `Please input the maximum lot area in square meters.`;
						response.send(new TextMessage(txt, noneKb),td);
					} else {
						td.statusid = "mainInquireParking";
						txt = `Please input the maximum lot area in square meters.`;
						response.send(new TextMessage(txt, noneKb),td);
					}
					break; 
				case "Industrial Vacant Lot":
					if(text == 'None'){
						td.statusid = "mainInquireParking";
						// txt = `Please input the maximum lot area in square meters. (Required)`;
						// response.send(new TextMessage(txt, cancel2Kb),td);
						txt = `Please input the maximum lot area in square meters.`;
						response.send(new TextMessage(txt, noneKb),td);
					} else {
						td.statusid = "mainInquireParking";
						txt = `Please input the maximum lot area in square meters.`;
						response.send(new TextMessage(txt, noneKb),td);
					}
					break;
				case "Raw Land":
					if(text == 'None'){
						td.statusid = "mainInquireParking";
						// txt = `Please input the maximum lot area in square meters. (Required)`;
						// response.send(new TextMessage(txt, cancel2Kb),td);
						txt = `Please input the maximum lot area in square meters.`;
						response.send(new TextMessage(txt, noneKb),td);
					} else {
						td.statusid = "mainInquireParking";
						txt = `Please input the maximum lot area in square meters.`;
						response.send(new TextMessage(txt, noneKb),td);
					}
					break;	
			}
		} else {
			response.send(new TextMessage(`You have input an incorrect value for Minimum Lot Area. Please try again.`,cancel2Kb),td);
		}
	}

	//Furnishings
	else if(text && userid == response.userProfile.id && statusid == "mainInquireLotAreaMax"){
		mainInquireFurnishing(message,response);
	}

	//Parking Slots
	else if(userid == response.userProfile.id && statusid == "mainInquireFurnishing" && text!= "SKIPALL"){
		//td.statusid = "mainInquireParking";
		//td.furnishing = text;
		let txt;
			switch (td.propertyType) {
				case "Residential Condo":
					td.statusid = "mainInquireParking";
					td.furnishing = text;
					txt = `Do you need parking slots?`;
					response.send(new TextMessage(txt, yesnoKb,null,null,null,4),td);
					break;
				case "Office Space":
					// td.statusid = "mainInquireParking";
					// td.furnishing = text;
					// txt = `Do you need parking slots?`;
					// response.send(new TextMessage(txt, yesnoKb,null,null,null,4),td);
					break; 
				case "Commercial with Improvements": 
					// text = text.split(",").join("");
					// if((isNaN(text) == false && Math.sign(text) == 1 && text != 0) || text == 'None'){
					// 	td.statusid = "mainInquireParking";
					// 	td.lotAreaMax = text;
					// 	txt = `Do you need parking slots?`;
					// 	response.send(new TextMessage(txt, yesnoKb,null,null,null,4),td);
					// } else {
					// 	response.send(new TextMessage(`You have entered an incorrect value for your Maximum Lot Area. I only accept numbers.`,cancel2Kb, null,null,null,4),td);
					// }
					break;
				case "Residential House & Lot":
					//txt = `This section is for the parking slots. Since the property type is ${td.propertyType}, the parking slots is N/A. Press Confirm to continue"`;
					//response.send(new TextMessage(txt, none2Kb, null,null,null,4),td);
					break;
				case "Industrial with Improvements":
					//txt = `This section is for the parking slots. Since the property type is ${td.propertyType}, the parking slots is N/A. Press Confirm to continue"`;
					//response.send(new TextMessage(txt,none2Kb, null,null,null,4),td);
					break;
				case "Residential Vacant Lot":
					//txt = `This section is for the parking slots. Since the property type is ${td.propertyType}, the parking slots is N/A. Press Confirm to continue"`;
					//response.send(new TextMessage(txt,none2Kb, null,null,null,4),td);
					break;
				case "Commercial Vacant Lot":
					//txt = `This section is for the parking slots. Since the property type is ${td.propertyType}, the parking slots is N/A. Press Confirm to continue"`;
					//response.send(new TextMessage(txt,none2Kb, null,null,null,4),td);
					break; 
				case "Industrial Vacant Lot":
					//txt = `This section is for the parking slots. Since the property type is ${td.propertyType}, the parking slots is N/A. Press Confirm to continue"`;
					//response.send(new TextMessage(txt,none2Kb, null,null,null,4),td);
					break;
				case "Raw Land":
					//txt = `This section is for the parking slots. Since the property type is ${td.propertyType}, the parking slots is N/A. Press Confirm to continue"`;
					//response.send(new TextMessage(txt,none2Kb, null,null,null,4),td);
					break;
		}
	}

	//Budget Minimum
	else if(text && userid == response.userProfile.id && statusid == "mainInquireParking"){
		//td.statusid = "mainInquireMinimumPrice";

		const skipAllKb = {
			"Type": "keyboard",
			"Buttons": [{
				"Text": "<b><font color=\"#000000\">SKIP</font></b>",
				"ActionType": "reply",
				"ActionBody": "None",
				"BgColor": "#c7b0e6",
				"TextOpacity": 100,
				"Rows": 1,
				"Columns": 6,
				"Silent": "true"
			},{
				"Text": "<b><font color=\"#000000\">SKIP ALL</font></b>",
				"ActionType": "reply",
				"ActionBody": "SKIPALL",
				"BgColor": "#FFAA88",
				"TextOpacity": 100,
				"Rows": 1,
				"Columns": 6
			},{
				"Text": "<b><font color=\"#000000\">GO BACK TO MENU</font></b>",
				"ActionType": "reply",
				"ActionBody": "CANCEL2",
				"BgColor": "#c7b0e6",
				"TextOpacity": 100,
				"Rows": 1,
				"Columns": 6
			}]
		};

		switch (td.propertyType) {
			case "Residential Condo":
				//
				td.statusid = "mainInquireMinimumPrice";
				if(text == "Yes"){
					td.parkingSlots = "With Parking";
					response.send(new TextMessage(`How much is your budget (minimum, in Pesos)?`,noneKb),td);
				} else if(text == "No"){
					td.parkingSlots = "Without Parking";
					response.send(new TextMessage(`How much is your budget (minimum, in Pesos)?`,noneKb),td);
				}
				break;
			case "Office Space":
				//
				td.statusid = "mainInquireMinimumPrice";
				if(text == "Yes"){
					td.parkingSlots = "With Parking";
					response.send(new TextMessage(`How much is your budget (minimum, in Pesos)?`,noneKb),td);
				} else if(text == "No"){
					td.parkingSlots = "Without Parking";
					response.send(new TextMessage(`How much is your budget (minimum, in Pesos)?`,noneKb),td);
				} else if(text == "Bare" || text == "Furnished"){
					td.furnishing = text;
					td.parkingSlots = "";
					response.send(new TextMessage(`How much is your budget (minimum, in Pesos)?`,noneKb),td);
				}
				break; 
			case "Commercial with Improvements": 
				td.statusid = "mainInquireMinimumPrice";	
				if(text == "Yes"){
					td.parkingSlots = "With Parking";
					// response.send(new TextMessage(`How much is your budget (minimum, in Pesos)?`,noneKb),td);
					response.send(new TextMessage(`How much is your budget (minimum, in Pesos)?`,skipAllKb),td);
				} else if(text == "No"){
					td.parkingSlots = "Without Parking";
					// response.send(new TextMessage(`How much is your budget (minimum, in Pesos)?`,noneKb),td);
					response.send(new TextMessage(`How much is your budget (minimum, in Pesos)?`,skipAllKb),td);
				} else if((isNaN(text.split(",").join("")) == false && Math.sign(text.split(",").join("")) == 1 && text.split(",").join("") != 0) || text.split(",").join("") == 'None') {
					td.lotAreaMax = text;
					td.parkingSlots = "";
					// response.send(new TextMessage(`How much is your budget (minimum, in Pesos)?`,noneKb),td);
					response.send(new TextMessage(`How much is your budget (minimum, in Pesos)?`,skipAllKb),td);
				} else {
					response.send(new TextMessage(`You have entered an incorrect value for your Maximum Lot Area. I only accept numbers.`,cancel2Kb, null,null,null,4),td);
				}
				break;
			case "Residential House & Lot":
				// td.statusid = "mainInquireMinimumPrice";	
				// td.furnishing = text;
				// response.send(new TextMessage(`How much is your budget (minimum, in Pesos)?`,noneKb),td);
				// break;
				if ((isNaN(text) == false && Math.sign(text) == 1 && text != 0) || message.text == 'None'){
					td.statusid = "mainInquireMinimumPrice";
					td.lotAreaMax = text;
					// response.send(new TextMessage(`How much is your budget (minimum, in Pesos)?`,noneKb),td);
					response.send(new TextMessage(`How much is your budget (minimum, in Pesos)?`,skipAllKb),td);
				} else {
					response.send(new TextMessage(`You have entered an incorrect value for your Maximum Lot Area. Please try again.`,cancel2Kb),td);
				}

				break;
			case "Industrial with Improvements":
				text = text.split(",").join("");
				if((isNaN(text) == false && Math.sign(text) == 1 && text != 0) || text == 'None'){
					td.statusid = "mainInquireMinimumPrice";
					td.lotAreaMax = text;
					// response.send(new TextMessage(`How much is your budget (minimum, in Pesos)?`,noneKb),td);
					response.send(new TextMessage(`How much is your budget (minimum, in Pesos)?`,skipAllKb),td);
				} else {
					response.send(new TextMessage(`You have entered an incorrect value for your Maximum Lot Area. I only accept numbers.`,cancel2Kb, null,null,null,4),td);
				}
				break;
			case "Residential Vacant Lot":
				text = text.split(",").join("");
				if((isNaN(text) == false && Math.sign(text) == 1 && text != 0) || text == 'None'){
					td.statusid = "mainInquireMinimumPrice";
					td.lotAreaMax = text;
					// response.send(new TextMessage(`How much is your budget (minimum, in Pesos)?`,noneKb),td);
					response.send(new TextMessage(`How much is your budget (minimum, in Pesos)?`,skipAllKb),td);
				} else {
					response.send(new TextMessage(`You have entered an incorrect value for your Maximum Lot Area. I only accept numbers.`,cancel2Kb, null,null,null,4),td);
				}
				break;
			case "Commercial Vacant Lot":
				text = text.split(",").join("");
				if((isNaN(text) == false && Math.sign(text) == 1 && text != 0) || text == 'None'){
					td.statusid = "mainInquireMinimumPrice";
					td.lotAreaMax = text;
					// response.send(new TextMessage(`How much is your budget (minimum, in Pesos)?`,noneKb),td);
					response.send(new TextMessage(`How much is your budget (minimum, in Pesos)?`,skipAllKb),td);
				} else {
					response.send(new TextMessage(`You have entered an incorrect value for your Maximum Lot Area. I only accept numbers.`,cancel2Kb, null,null,null,4),td);
				}
				break; 
			case "Industrial Vacant Lot":
				text = text.split(",").join("");
				if((isNaN(text) == false && Math.sign(text) == 1 && text != 0) || text == 'None'){
					td.statusid = "mainInquireMinimumPrice";
					td.lotAreaMax = text;
					// response.send(new TextMessage(`How much is your budget (minimum, in Pesos)?`,noneKb),td);
					response.send(new TextMessage(`How much is your budget (minimum, in Pesos)?`,skipAllKb),td);
				} else {
					response.send(new TextMessage(`You have entered an incorrect value for your Maximum Lot Area. I only accept numbers.`,cancel2Kb, null,null,null,4),td);
				}
				break;
			case "Raw Land":
				text = text.split(",").join("");
				if((isNaN(text) == false && Math.sign(text) == 1 && text != 0) || text == 'None'){
					td.statusid = "mainInquireMinimumPrice";
					td.lotAreaMax = text;
					// response.send(new TextMessage(`How much is your budget (minimum, in Pesos)?`,noneKb),td);
					response.send(new TextMessage(`How much is your budget (minimum, in Pesos)?`,skipAllKb),td);
				} else {
					response.send(new TextMessage(`You have entered an incorrect value for your Maximum Lot Area. I only accept numbers.`,cancel2Kb, null,null,null,4),td);
				}
				break;
		}
		
			
	}

	//Budget Maximum
	else if(text && userid == response.userProfile.id && statusid == "mainInquireMinimumPrice" && text != "SKIPALL"){
		text = text.split(",").join("")
		if((isNaN(text) == false && Math.sign(text) == 1 && text != 0) || text == 'None'){
			td.statusid = "mainInquireMaximumPrice";
			td.minimumPrice = text;
			response.send(new TextMessage(`How much is your budget (maximum, in Pesos)?`,noneKb),td);
		} else {
			response.send(new TextMessage(`You have entered an incorrect value for Minimum Budget. Please try again.`,cancel2Kb),td);
		}
		
	}

	else if(text == "SKIPALL"){

		const confirmSkipAllKb = {
			"Type": "keyboard",
			"InputFieldState": "hidden",
			"Buttons": [{
				"Text": "<b><font color=\"#000000\">Confirm</font></b>",
				"ActionType": "reply",
				"ActionBody": "None",
				"TextOpacity": 100,
				"Rows": 1,
				"Columns": 6,
				"BgColor": "#c7b0e6",
			},{
				"Text": "<b><font color=\"#000000\">GO BACK TO MAIN MENU</font></b>",
				"ActionType": "reply",
				"ActionBody": "CANCEL2",
				"BgColor": "#FFAA88",
				"TextOpacity": 100,
				"Rows": 1,
				"Columns": 6
			}]
		};

		td.statusid = "mainInquireMaximumPrice";
		// txt = "You will receive broader search results if you skip all, do you confirm?";
		txt = "We recommend adding more criteria to see relevant results. You will receive broader search results if you skip all, do you confirm?"
		response.send(new TextMessage(txt, confirmSkipAllKb),td);
	}

	//CONFIRMATION OF Inquiry)
	else if(text && userid == response.userProfile.id && statusid == "mainInquireMaximumPrice"){
		text = text.split(",").join("");
		if((isNaN(text) == false && Math.sign(text) == 1 && text != 0) || text == 'None'){
			let condoName = "";
			let rooms = "";
			let minfloor = "";
			let maxfloor = "";
			let minlot = "";
			let maxlot = "";
			let minbudget = "";
			let maxbudget = "";
			let parking = "";
			let furnishing = "";
			let commercial = "";
			td.maximumPrice = text;

			
			if(message.trackingData.condoName && message.trackingData.condoName != "None"){
				switch (td.propertyType) {
					case "Residential Condo":
						condoName = "Condo Name: " + message.trackingData.condoName + "\n";
						break;
					case "Office Space":
						condoName = "Building Name: " + message.trackingData.condoName + "\n";
						break; 
					case "Commercial with Improvements": 
						condoName = "Building Name/Area: " + message.trackingData.condoName + "\n";
						break;
					case "Residential House & Lot":
						condoName = "Village/Area: " + message.trackingData.condoName + "\n";
						break;
					case "Industrial with Improvements":
						condoName = "Industrial Park/Area: " + message.trackingData.condoName + "\n";
						break;
					case "Residential Vacant Lot":
						condoName = "Village/Area: " + message.trackingData.condoName + "\n";
						break;
					case "Commercial Vacant Lot":
						condoName = "Area: " + message.trackingData.condoName + "\n";
						break; 
					case "Industrial Vacant Lot":
						condoName = "Industrial Park/Area: " + message.trackingData.condoName + "\n";
						break;
					case "Raw Land":
						condoName = "Area: " + message.trackingData.condoName + "\n";
						break;
				}
			}
			if(message.trackingData.rooms && message.trackingData.rooms != "None"){
				rooms = "Number of Rooms: " + message.trackingData.rooms + "\n";  
			}
			if(message.trackingData.floorAreaMin && message.trackingData.floorAreaMin != "None"){
				minfloor = "Minimum Floor Area: " + message.trackingData.floorAreaMin + " sqm\n";  
			}
			if(message.trackingData.floorAreaMax && message.trackingData.floorAreaMax != "None"){
				maxfloor = "Maximum Floor Area: " + message.trackingData.floorAreaMax + " sqm\n";  
			}
			if(message.trackingData.lotAreaMin && message.trackingData.lotAreaMin != "None"){
				minlot = "Minimum Lot Area: "+ message.trackingData.lotAreaMin + " sqm\n";  
			}
			if(message.trackingData.lotAreaMax && message.trackingData.lotAreaMax != "None"){
				maxlot = "Maximum Lot Area: "+ message.trackingData.lotAreaMax + " sqm\n";  
			}
			if(message.trackingData.minimumPrice && message.trackingData.minimumPrice != "None"){
				minbudget = "Minimum Budget: "+ message.trackingData.minimumPrice + " Pesos\n";  
			}
			if(td.maximumPrice && td.maximumPrice != "None"){
				maxbudget = "Maximum Budget: "+ text + " Pesos\n";  
			}
			if(message.trackingData.parkingSlots && message.trackingData.parkingSlots != "None" ){
				parking = "Parking: " + message.trackingData.parkingSlots + "\n" 
			}
			if(message.trackingData.furnishing && message.trackingData.furnishing != "None"){
				furnishing = "Furnishings: "+ message.trackingData.furnishing + "\n"
			}
			if(message.trackingData.commercialType && message.trackingData.commercialType != "None"){
				commercial = "Commercial Type: "+ message.trackingData.commercialType + "\n"
			}

			const text2 = "Transaction: " + message.trackingData.property + "\n" +
				"Property Type: " + message.trackingData.propertyType + "\n" +
				commercial +
				"Location: " + message.trackingData.loc + "\n" +
				condoName +
				rooms +
				minfloor +
				maxfloor +
				minlot +
				maxlot +
				furnishing +
				parking +
				minbudget+
				maxbudget;

			td.statusid = "mainInquireConfirmation";
			
			/////
			showInquire(message, response)
			/////
			response.send(new TextMessage(`Before I search our database, please confirm the following: \n` + text2, confirm2Kb,null,null,null,4),td);	
		} else {
			response.send(new TextMessage(`You have entered an incorrect value for Budget Price. Please try again.`,cancel2Kb),td);
		}
	}

	else if(text && userid == response.userProfile.id && statusid == "mainInquireConfirmation" ){
		const kb = {
			"Type": "keyboard",
			"InputFieldState": "hidden",
			"Buttons": [{
				"Text": "<b><font color=\"#000000\">Save Inquiry</font></b>",
				"ActionType": "reply",
				"ActionBody": "Proceed",
				"BgColor": "#c7b0e6",
				"TextOpacity": 100,
				"Rows": 1,
				"Columns": 6
			}, {
				"Text": "<b><font color=\"#000000\">Go Back to Main Menu</font></b>",
				"ActionType": "reply",
				"ActionBody": "CANCEL2",
				"BgColor": "#FFAA88",
				"TextOpacity": 100,
				"Rows": 1,
				"Columns": 6
			}]	
		};
		// if (inquirePayload[userid].length == 0){
		if ((inquirePayload[userid] && inquirePayload[userid].length == 0) || !(inquirePayload[userid])){
			td.statusid = "mainInquireContact"
			response.send(new TextMessage("I'm sorry but there is nothing that matches your inquiry.", kb,null,null,null,4),td);
		} else {
			let num = 0;
			let number = 0;
			let action = [];
			let msgArray = [];
			for(payload of inquirePayload[userid]){
				action[num] = {
					//"Property" : num+1,
					//"Property ID": payload.fields["Suggested Property ID"],
					//"Property Summary": payload.fields["Result Header"],
					"Transaction" : payload.fields["Property Purpose"],
					"Property Type" : payload.fields["Property Type"],
					//"Condo/Area/Building Name": payload.fields['Location Name'],
					//"Location" : payload.fields['Location']
				}

				if(payload.fields["Property Type"] == "Commercial with Improvements"){
					action[num]["Commercial Type"] = payload.fields['Commercial Type'];
				}

				action[num]["Location"] = payload.fields['Location'];

				switch (payload.fields["Property Type"]) {
					case "Residential Condo":
						action[num]["Condo Name"] = payload.fields['Location Name'];
						break;
					case "Office Space":
						action[num]["Building Name"] = payload.fields['Location Name'];	
						break; 
					case "Commercial with Improvements": 
						action[num]["Building Name/Area"] = payload.fields['Location Name'];
						break;
					case "Residential House & Lot":
						action[num]["Village/Area"] = payload.fields['Location Name'];
						break;
					case "Industrial with Improvements":
						action[num]["Industrial Park/Area"] = payload.fields['Location Name'];	
						break;
					case "Residential Vacant Lot":
						action[num]["Village/Area"] = payload.fields['Location Name'];
						break;
					case "Commercial Vacant Lot":
						action[num]["Area"] = payload.fields['Location Name'];
						break; 
					case "Industrial Vacant Lot":
						action[num]["Industrial Park/Area"] = payload.fields['Location Name'];
						break;
					case "Raw Land":
						action[num]["Area"] = payload.fields['Location Name'];
						break;
				}


				if(payload.fields['Number of Rooms'] && payload.fields['Number of Rooms'] != 0){
					action[num]["Number of Rooms"] = payload.fields['Number of Rooms'];
				}

				if(payload.fields.Furnishing){
					action[num]["Furnishing"] = payload.fields['Furnishing'];
				}
				if(payload.fields['Lot Area'] && payload.fields['Lot Area'] != 0){
					action[num]["Lot Area"] = payload.fields['Lot Area'] + " sqm";
				}
				if(payload.fields['Floor Area'] && payload.fields['Floor Area'] != 0){
					action[num]["Floor Area"] = payload.fields['Floor Area'] + " sqm";
				}
				if(payload.fields['Parking Slots']){
					action[num]["Parking Slots"] = payload.fields['Parking Slots'];
				}
				
				action[num]["Price"] = payload.fields['Price2'];
				
				if(payload.fields['Property Detail']){
					action[num]["Property Detail"] = payload.fields['Property Detail'];
				}
				
				
				///
				action[num]["Viber ID"] = payload.fields['Viber ID'];
				action[num]["Sub Group"] = payload.fields['Sub Group'];
				action[num]["Suggested"] = payload.fields['Suggested'];
				action[num]["Suggested Client"] = payload.fields['Suggested Client'];
				///
				
				action[num]["Images"] = []
				if (payload.fields['Property Image1']) {
					action[num]["Images"].push(payload.fields['Property Image1']);
				}
				if (payload.fields['Property Image2']) {
					action[num]["Images"].push(payload.fields['Property Image2']);
				}
				if (payload.fields['Property Image3']) {
					action[num]["Images"].push(payload.fields['Property Image3']);
				}
				if (payload.fields['Property Image4']) {
					action[num]["Images"].push(payload.fields['Property Image4']);
				}
				if (payload.fields['Property Image5']) {
					action[num]["Images"].push(payload.fields['Property Image5']);
				}
				
				action[num]["Property ID"] = payload.fields["Suggested Property ID"];

				num = num + 1;
			}
			

			let richView = {
				"ButtonsGroupColumns": 6,
				"ButtonsGroupRows": 7,
				"BgColor": "#FFFFFF",
				"Buttons": []
			};
			let attach3 = {};
			let attach2 = {};
			//let attach = {};
			let textUri = "";
			let counter = 0;
			console.log(action)
			let summary = "";
			if(td.groupType == "Broker"){
				summary = "Suggested"
			}else{
				summary = "Suggested Client"
			}
			let text = "";
			let arrayer = [];
			let textSummary = "";
			(async () => {
			for(values of action){
				
				number = number + 1;
				counter = counter + 1;
				
				/*
				attach = {
					"ActionBody": "none",
					"Text": "Property " + counter,
					"Silent": "true",
					"Rows": 1,
					"Columns": 6
				}
				richView.Buttons.push(attach);
				*/

				
				if(values["Sub Group"] == "Client" || values["Sub Group"] == "Admin"){
					////////
					try {
						//text = "Dee Chan, PRC 19147 \n09171727788; chan@gmail.com"

						
						if(values["Sub Group"] == "Admin") {
							const query = await airTableCredentials.read({
								// filterByFormula: `{ID} = "recq1P9ND0tU7pFjt"`
								filterByFormula: `{ID} = "rec23iYg4V4fGnX3C"`
							});
							text = query[0].fields["Summary"]
							console.log("pumasok sa if client" + text)
						} else {
							text = "Reach out to an NREA Broker for more details."
						}

						delete values["Sub Group"]
						delete values["Viber ID"]
						textSummary = values[summary]
						delete values["Suggested"]
						delete values["Suggested Client"]
						//values["Contact Information"] = text

						arrayer = [values];
						textUri = `proptechph.com/display.html?payload=` + encodeURIComponent(JSON.stringify(arrayer));
						attach2 = {
							"ActionBody": textUri,
							"Text": textSummary.replace(/\n/g, "<br>"),
							"ActionType": "open-url",
							"OpenURLType": "internal",
							"Silent": "true",
							//"TextShouldFit": "true",
							"TextSize" : "small",
							"TextHAlign": "left",
							"TextVAlign": "top",
							"Rows": 5,
							"Columns": 6
						}
						richView.Buttons.push(attach2);		
						attach3 = {
							"ActionBody": "none",
							"Text": text,
							"Silent": "true",
							//"TextShouldFit": "true",
							"TextSize" : "small",
							"TextHAlign": "left",
							"BgColor": "#C1E7E3",
							"Rows": 2,
							"Columns": 6
						}
						richView.Buttons.push(attach3);
					} catch (error) {
						console.error(error)
					}
	

				} else if(values["Sub Group"] == "HLURB"){
					try {
						const query = await airTableHLURB.read({
							filterByFormula: `{Viber ID} = "${values["Viber ID"]}"`
						});
						text = query[0].fields["Profile Summary"]
						
						const query2 = await airTableCredentials.read({
							filterByFormula: `{ID} = "recq1P9ND0tU7pFjt"`
						});
		
						if(query.length != 0){
							text = query[0].fields["Profile Summary"]
						} else {
							text = query2[0].fields["Summary"]
						}
						delete values["Sub Group"]
						delete values["Viber ID"]
						textSummary = values[summary]
						delete values["Suggested"]
						delete values["Suggested Client"]
						
						values["Contact Information"] = text
						arrayer = [values];
						textUri = `proptechph.com/display.html?payload=` + encodeURIComponent(JSON.stringify(arrayer));
						attach2 = {
							"ActionBody": textUri,
							"Text": textSummary.replace(/\n/g, "<br>"),
							"ActionType": "open-url",
							"OpenURLType": "internal",
							"Silent": "true",
							"TextSize" : "small",
							//"TextShouldFit": "true",
							"TextHAlign": "left",
							"TextVAlign": "top",
							"Rows": 5,
							"Columns": 6
						}
						richView.Buttons.push(attach2);		
						attach3 = {
							"ActionBody": "none",
							"Text": text,
							"Silent": "true",
							"TextSize" : "small",
							//"TextShouldFit": "true",
							"TextHAlign": "left",
							"BgColor": "#C1E7E3",
							"Rows": 2,
							"Columns": 6
						}
						richView.Buttons.push(attach3);	
					} catch (error) {
						console.error(error)
					}
					
				} else if(values["Sub Group"] == "PRC"){
					try {
						var requesterViberId = JSON.stringify(response.userProfile.id)

						const query1 = await airTableClients.read({
							filterByFormula: `{Viber ID} = ${requesterViberId}`
						});

						const query = await airTablePRC.read({
							filterByFormula: `{Viber ID} = "${values["Viber ID"]}"`
						});
						//text = query[0].fields["Profile Summary"]
						const query2 = await airTableCredentials.read({
							// filterByFormula: `{ID} = "recq1P9ND0tU7pFjt"`
							filterByFormula: `{ID} = "rec23iYg4V4fGnX3C"`
						});
						
						if(query1 && query1.length != 0){
							text = query2[0].fields["Summary"]
						}
						else if(query.length != 0){
							text = query[0].fields["Profile Summary"]
						} else {
							text = query2[0].fields["Summary"]
						}
						
						delete values["Sub Group"]
						delete values["Viber ID"]
						textSummary = values[summary]
						delete values["Suggested"]
						delete values["Suggested Client"]
						values["Contact Information"] = text
						arrayer = [values];
						textUri = `proptechph.com/display.html?payload=` + encodeURIComponent(JSON.stringify(arrayer));
						attach2 = {
							"ActionBody": textUri,
							"Text": textSummary.replace(/\n/g, "<br>"),
							"ActionType": "open-url",
							"OpenURLType": "internal",
							"Silent": "true",
							"TextSize" : "small",
							//"TextShouldFit": "true",
							"TextHAlign": "left",
							"TextVAlign": "top",
							"Rows": 5,
							"Columns": 6
						}
						richView.Buttons.push(attach2);
						attach3 = {
							"ActionBody": "none",
							"Text": text,
							"Silent": "true",
							"TextSize" : "small",
							//"TextShouldFit": "true",
							"TextHAlign": "left",
							"BgColor": "#C1E7E3",
							"Rows": 2,
							"Columns": 6
						}
						richView.Buttons.push(attach3);	
					} catch (error) {
						console.error(error)
					}
				}

				if(number == 4){
					msgArray.push(new RichMediaMessage(richView))
					richView = {
						"ButtonsGroupColumns": 6,
						"ButtonsGroupRows": 7,
						"BgColor": "#FFFFFF",
						"Buttons": []
					};
					attach = {};
					attach2 = {};
					attach3 = {};
					number = 0;
					text = "";
					arrayer = [];
				} else if (counter == action.length) {
					console.log(richView)
					msgArray.push(new RichMediaMessage(richView))
				}
				
			}
			
			td.statusid = "mainInquireContact"
			msgArray.push(new TextMessage("End of Listings. "));
			msgArray.push(new TextMessage("Congratulations! There are matched properties for your search.",kb,null,null,null,4));
			bot.sendMessage(response.userProfile,msgArray,td);
			})();
		}
	}


	else if(text == "Proceed" && userid == response.userProfile.id && statusid == "mainInquireContact" && td.groupType == "Client" ){
		inquirePayload[userid] = null;
		const txt = "Do you wish Broker/Agent from NREA community to contact you about your inquiry?";
		td.statusid = "mainInquireSave";
		response.send(new TextMessage(txt, yesnoKb,null,null,null,3),td);
	}

	else if (userid == response.userProfile.id && ((statusid == "mainInquireSave") || ( text == "Proceed" && statusid == "mainInquireContact"))){
		propertyInquiry(message, response);
	}

	

	/////////////////////////
	// START OF My Account //
	/////////////////////////
	//Main Account Start
	else if(text == 'My Account' && userid == response.userProfile.id && statusid == "mainMenu"){
		submission(message);
		search(message);
		supervision(message);
		validatedBroker(message);
		mainAccountStart(message,response);
	}
	
	// Submission made by the User
	else if(text == 'Submissions' && userid == response.userProfile.id && statusid == "mainAccountStart"){	
		if(submissionPayload[userid].length == 0){
			response.send(new TextMessage("I'm sorry but you don't have any history to show.", cancel2Kb,null,null,null,4),td);
		} else {
			let enlistingArray = [];
			let transactionArray = [];
			let num = 0;
			let number = 0;
			let action = [];
			let msgArray = [];
			let createdate;
			let formatdate;
			
			cmp = function(x,y){
				return x > y ? 1 :x < y ? -1 : 0;
			};
			
			submissionPayload[userid].sort( function(a,b){
				return cmp(
					[cmp(a.fields["Region Code"], b.fields["Region Code"]), cmp(a.fields["City/Town"], b.fields["City/Town"]), cmp(a.fields["Property Purpose"], b.fields["Property Purpose"]), cmp(a.fields["Property Type"], b.fields["Property Type"]) ],
					[cmp(b.fields["Region Code"], a.fields["Region Code"]), cmp(b.fields["City/Town"], a.fields["City/Town"]), cmp(b.fields["Property Purpose"], a.fields["Property Purpose"]), cmp(b.fields["Property Type"], a.fields["Property Type"]) ]
				);
			});
			
			for(payload of submissionPayload[userid]){
				//console.log(payload.fields);
				createdate = new Date(payload.fields['Date Created'])
				//console.log(createdate)
				formatdate = (createdate.getMonth() + 1) + "/" + createdate.getDate() + "/" + createdate.getFullYear();
				action[num] = {
					//"Property" : num+1,
					//"Property ID": payload.fields["Suggested Property ID"],
					"Created Date": formatdate,
					//"Property Summary": payload.fields["Result Header"],
					//"Name" : payload.fields.Name,
					"Transaction" : payload.fields["Property Purpose"],
					"Property Type" : payload.fields["Property Type"],
					//"Condo/Area/Building Name": payload.fields['Location Name'],
					//"Location" : payload.fields['Location']
				}
				if(payload.fields["Property Type"] == "Commercial with Improvements"){
					action[num]["Commercial Type"] = payload.fields['Commercial Type'];
				}

				action[num]["Location"] = payload.fields['Location'];


				if(payload.fields['Location Name']){
					switch (payload.fields["Property Type"]) {
						case "Residential Condo":
							action[num]["Condo Name"] = payload.fields['Location Name'];
							break;
						case "Office Space":
							action[num]["Building Name"] = payload.fields['Location Name'];	
							break; 
						case "Commercial with Improvements": 
							action[num]["Building Name/Area"] = payload.fields['Location Name'];
							break;
						case "Residential House & Lot":
							action[num]["Village/Area"] = payload.fields['Location Name'];
							break;
						case "Industrial with Improvements":
							action[num]["Industrial Park/Area"] = payload.fields['Location Name'];	
							break;
						case "Residential Vacant Lot":
							action[num]["Village/Area"] = payload.fields['Location Name'];
							break;
						case "Commercial Vacant Lot":
							action[num]["Area"] = payload.fields['Location Name'];
							break; 
						case "Industrial Vacant Lot":
							action[num]["Industrial Park/Area"] = payload.fields['Location Name'];
							break;
						case "Raw Land":
							action[num]["Area"] = payload.fields['Location Name'];
							break;
					}	  
				}

				if(payload.fields['Number of Rooms'] && payload.fields['Number of Rooms'] != 0){
					action[num]["Number of Rooms"] = payload.fields['Number of Rooms'];
				}

				if(payload.fields.Furnishing){
					action[num]["Furnishing"] = payload.fields['Furnishing'];
				}
				if(payload.fields['Lot Area'] && payload.fields['Lot Area'] != 0){
					action[num]["Lot Area"] = payload.fields['Lot Area'] + " sqm";
				}
				if(payload.fields['Floor Area'] && payload.fields['Floor Area'] != 0){
					action[num]["Floor Area"] = payload.fields['Floor Area'] + " sqm";
				}
				if(payload.fields['Parking Slots']){
					action[num]["Parking Slots"] = payload.fields['Parking Slots'];
				}
				
				action[num]["Price"] = payload.fields['Price2'];

				
				if(payload.fields['Property Detail']){
					action[num]["Property Detail"] = payload.fields['Property Detail'];
				}
				
				//
				action[num]["Suggested"] = payload.fields['Suggested'];
				action[num]["Suggested Client"] = payload.fields['Suggested Client'];
				action[num]["City/Town"] = payload.fields['City/Town'];
				action[num]["Region/State"] = payload.fields['Region/State'];
				//
				
				action[num]["Images"] = []
				if (payload.fields['Property Image1']) {
					action[num]["Images"].push(payload.fields['Property Image1']);
				}
				if (payload.fields['Property Image2']) {
					action[num]["Images"].push(payload.fields['Property Image2']);
				}
				if (payload.fields['Property Image3']) {
					action[num]["Images"].push(payload.fields['Property Image3']);
				}
				if (payload.fields['Property Image4']) {
					action[num]["Images"].push(payload.fields['Property Image4']);
				}
				if (payload.fields['Property Image5']) {
					action[num]["Images"].push(payload.fields['Property Image5']);
				}
				action[num]["Property ID"] = payload.fields["Suggested Property ID"];

				enlistingArray[num] = payload.fields["Enlisting Code"];
				transactionArray[num] = payload.fields["Property Type"];
				num = num + 1;

			}
			td.transactionArray = transactionArray;
			td.enlistArray = enlistingArray;
			
			let richView = {
				"ButtonsGroupColumns": 6,
				"ButtonsGroupRows": 7,
				"BgColor": "#FFFFFF",
				"Buttons": []
			};
			let attach = {};
			let attach2 = {}
			let textUri = "";
			let counter = 0;
			if(td.groupType == "Broker"){
				summary = "Suggested"
			}else{
				summary = "Suggested Client"
			}
			let text = "";

			console.log(action)
			for(values of action){
				number = number + 1;
				counter = counter + 1;
				text = values[summary];
				delete values["Suggested"]
				delete values["Suggested Client"]
				delete values["Region/State"]
				delete values["City/Town"]
				let arrayer = [values];
				textUri = `proptechph.com/display.html?payload=` + encodeURIComponent(JSON.stringify(arrayer));
				attach = {
					"ActionBody": "none",
					"Text": "Property "+ counter,
					"Silent": "true",
					"BgColor": "#C1E7E3",
					"Rows": 1,
					"Columns": 6
				}
				richView.Buttons.push(attach);
				attach2 = {
					"ActionBody": textUri,
					"Text": text.replace(/\n/g, "<br>"),
					"ActionType": "open-url",
					"OpenURLType": "internal",
					"Silent": "true",
					//"TextSize" : "small",
					"TextHAlign": "left",
					"TextVAlign": "top",
					"Rows": 6,
					"Columns": 6
				}
				richView.Buttons.push(attach2);

				if(number == 4){
					msgArray.push(new RichMediaMessage(richView))
					richView = {
						"ButtonsGroupColumns": 6,
						"ButtonsGroupRows": 7,
						"BgColor": "#FFFFFF",
						"Buttons": []
					};
					attach = {};
					number = 0;
				} else if (counter == action.length) {
					//console.log(richView)
					msgArray.push(new RichMediaMessage(richView))
				}
				
			}
			msgArray.push(new TextMessage("End of Listings. "));
			msgArray.push(new TextMessage("You can also edit/delete your submissions here by providing the Property Number.", cancel2Kb,null,null,null,3));
			td.statusid = "submission";
			bot.sendMessage(response.userProfile,msgArray,td);
		} 
	}

	// for bypassing matching
	else if(text == 'GetMatches' && userid == response.userProfile.id && statusid == "mainAccountStart"){
		setSpecialMatches(message,response,td);
	}

	// my subscription
	else if(text == 'My Subscription' && userid == response.userProfile.id && statusid == "mainAccountStart"){	
		getMySubscription(message,response,td)
	}

	else if(text && userid == response.userProfile.id && statusid == "submitProof"){
		td.statusid = "proofSubmitted"
		response.send(new TextMessage('Please upload an image of your proof of payment.',cancel2Kb),td);
	}

	else if(message.url && statusid == "proofSubmitted" && userid == response.userProfile.id){
		// const updateRes = await airTableHLURB.updateWhere(`{Viber ID} = "${message.trackingData.userid}"`, {
		// 	// Validated: "Yes"
		// 	"Proof of Payment": message.url 
		// });
		updateProofOfPayment(message,message.url)
		response.send(new TextMessage('Thank you for submitting your proof of payment, please check again later for confirmation.', cancel2Kb),td);
	}

	// broadcast preference
	else if(text == "Broadcast Preference" && userid == response.userProfile.id && statusid == "mainAccountStart"){
		// setBroadcastPreference(message,response,td)
		td.statusid = "setBroadcastPreference";
		response.send(new TextMessage(`What would you like to do today?`, broadcastPreferenceKb,null,null,null,4),td);
	}

	else if(text == "https://proptechph.com/broadcast_preference.html" && userid == response.userProfile.id && statusid == "setBroadcastPreference"){
		const broadcastPreferenceKb2 = {
			"Type": "keyboard",
			// "InputFieldState": "hidden",
			"Buttons": [{
				"Columns": 6,
				"Rows": 1,
				"Text": "<font color=\"#494E67\"><b>Set Broadcast Preference</b></font>",
				"TextSize": "medium",
				"TextHAlign": "center",
				"TextVAlign": "middle",
				"ActionType": "open-url",
				"ActionBody": "https://proptechph.com/broadcast_preference.html",
				"OpenURLType": "internal",
				// "Silent": "true",
				"BgColor": "#c7b0e6",
				"TextOpacity": 100
			},{
				"Text": "<b><font color=\"#000000\">GO BACK TO MAIN MENU</font></b>",
				"ActionType": "reply",
				"ActionBody": "CANCEL2",
				"BgColor": "#FFAA88",
				"TextOpacity": 100,
				"Rows": 1,
				"Columns": 6
			}]
		};
		response.send(new KeyboardMessage(broadcastPreferenceKb2,null,null,null,4),td);
	}

	else if(text && text != "https://proptechph.com/broadcast_preference.html" && userid == response.userProfile.id && statusid == "setBroadcastPreference"){
		let nameSplit = text.split(";");
		
		if(nameSplit.length == 3){
			updateBroadcastPreference(nameSplit,message,response,td);
		}
	}

	//Edit or Delete Option
	else if (isNaN(text) == false && userid == response.userProfile.id && statusid == "submission") {
		if(text > td.enlistArray.length){
			response.send(new TextMessage("You have entered an invalid property number. Please choose only among the property numbers presented to you.", cancel2Kb,null,null,null,4),td);
		} else {
			td.enlistCode = td.enlistArray[parseInt(text,10)-1];
			td.propType = td.transactionArray[parseInt(text,10)-1]
			td.statusid = "submissionOption";
			response.send(new TextMessage("Would you like to delete or edit Property Number " + text + "?", submissionKb,null,null,null,4),td);
		}

	}

	//Delete property Confirmation
	else if (text == "Delete2" && userid == response.userProfile.id && statusid == "submissionOption"){
		//deleteEntry(message);
		td.statusid = "deleteConfirmation"
		response.send(new TextMessage("Are you sure you want to delete this property?", confirm2Kb,null,null,null,3),td);
	}

	//Delete property
	else if (text == "Confirm" && userid == response.userProfile.id && statusid == "deleteConfirmation"){
		deleteEntry(message);
		//td.statusid = "mainMenu";
		const groupKb = {
			"Type": "keyboard",
			"InputFieldState": "hidden",
			"Buttons": [{
			"Text": "<b><font color=\"#000000\">Go back to Main Menu</font></b>",
			"ActionType": "reply",
			"ActionBody": "CANCEL2",
			"BgColor": "#FFAA88",
			"TextOpacity": 100,
			"Rows": 1,
			"Columns": 6
		}]
		};
		response.send(new TextMessage("We have successfully deleted the property.", groupKb,null,null,null,4),{
			statusid: "registered",
			userid: response.userProfile.id,
			nameReg: message.trackingData.nameReg,
			groupType: message.trackingData.groupType,
			subGroup: message.trackingData.subGroup
		})
	}

	//Edit Property (Choose which parameter to edit)
	else if (text == "Edit" && userid == response.userProfile.id && statusid == "submissionOption"){
		td.statusid = "editOption"
		response.send(new TextMessage("What would you like to edit?", editKb ,null,null,null,3),td);
	}

	// Edit Specific Parameter (1)
	else if (text && userid == response.userProfile.id && statusid == "editOption"){
		
		switch (text) {
			/*
			case "Property Purpose":
				td.editParameter = text;
				td.statusid = "editSpecific";
				response.send(new TextMessage("What would you change it to?", propertyKb,null,null,null,4),td);
				break;
			
			case "Property Type":
				td.editParameter = text;
				td.statusid = "editSpecific";
				response.send(new TextMessage("What would you change it to?", propertyKb2,null,null,null,4),td);
				break;
			*/
			case "Condo/Area/Building Name":
				td.editParameter = text;
				td.statusid = "editSpecific";
				response.send(new TextMessage("What would you change it to?", cancel2Kb),td);
				break;
			case "Number of Rooms":
				if(td.propType == "Residential Condo" || td.propType == "Residential House & Lot"){
					td.editParameter = text;
					td.statusid = "editSpecific";
					response.send(new TextMessage("What would you change it to?", cancel2Kb),td);
				} else {
					response.send(new TextMessage("That property does not have a Number of Rooms parameter. What would you like to edit?", editKb ,null,null,null,3),td);
				}
				break;
			case "Floor Area":
				if(td.propType == "Residential Condo" || td.propType == "Residential House & Lot" 
				|| td.propType == "Office Space" || td.propType == "Commercial with Improvements"
				|| td.propType == "Industrial with Improvements"){
					td.editParameter = text;
					td.statusid = "editSpecific";
					response.send(new TextMessage("What would you change it to?", cancel2Kb),td);
				} else {
					response.send(new TextMessage("That property does not have a Floor Area parameter. What would you like to edit?", editKb ,null,null,null,3),td);
				}
				break;
			case "Lot Area":
				if(td.propType == "Residential House & Lot" || td.propType == "Residential Vacant Lot" 
				|| td.propType == "Commercial with Improvements"|| td.propType == "Industrial with Improvements"
				|| td.propType == "Commercial Vacant Lot"|| td.propType == "Industrial Vacant Lot"
				|| td.propType == "Raw Land"){
					td.editParameter = text;
					td.statusid = "editSpecific";
					response.send(new TextMessage("What would you change it to?", cancel2Kb),td);
				} else {
					response.send(new TextMessage("That property does not have a Lot Area parameter. What would you like to edit?", editKb,null,null,null,3),td);
				}
				break;
			case "Furnishing":
				if(td.propType == "Residential Condo" || td.propType == "Residential House & Lot"
				|| td.propType == "Office Space"){
					td.editParameter = text;
					td.statusid = "editSpecific";	
					response.send(new TextMessage("What would you change it to?", furnishKb,null,null,null,4),td);
				} else {
					response.send(new TextMessage("That property does not have a Furnishing parameter. What would you like to edit?", editKb ,null,null,null,3),td);
				}
				break;
			case "Parking Slots":
				if(td.propType == "Residential Condo" || td.propType == "Commercial with Improvements"
				|| td.propType == "Office Space"){
					td.editParameter = text;
					td.statusid = "editSpecific";
					response.send(new TextMessage("What would you change it to?", yesnoKb,null,null,null,4),td);
				} else {
					response.send(new TextMessage("That property does not have a Parking parameter. What would you like to edit?", editKb ,null,null,null,3),td);
				}
				break;
			case "Price":
				td.editParameter = text;
				td.statusid = "editSpecific";
				response.send(new TextMessage("What would you change it to?", cancel2Kb),td);
				break;
			case "Property Detail":
				td.editParameter = text;
				td.statusid = "editSpecific";
				response.send(new TextMessage("What would you change it to? Limited up to 200 Characters.", cancel2Kb),td);
				break;

			}
		
	}
	// Edit Confirmation (2)
	else if (text && userid == response.userProfile.id && statusid == "editSpecific"){
		if((td.editParameter == "Floor Area" || td.editParameter == "Number of Rooms" 
			|| td.editParameter == "Lot Area" || td.editParameter == "Price")
				&& (isNaN(text) == true || Math.sign(text) == -1 || text == 0)){
					response.send(new TextMessage("You have input an incorrect value. This parameter is only to accept numbers.",cancel2Kb),td);
				}
		else {
			if(td.editParameter == "Property Detail" && text.length > 200){
				response.send(new TextMessage(`The property details you have provided exceeded the 200 character limit. Please make adjustments to save your property details.`,cancel2Kb),td);
			} else {
				td.toEdit = text;
				if(td.editParameter == "Parking Slots"){
					if(text == "Yes"){
						td.toEdit  = "With Parking"
					} else if (text == "No"){
						td.toEdit = "Without Parking"
					}
				}
				td.statusid = "editConfirmation"
				const txt2 = `Are you sure you want to change the value of ${td.editParameter} to ${td.toEdit}?`   
				response.send(new TextMessage(txt2, confirm2Kb),td);
			}
			
			
		}
		
	}
	// Edit Final (3)
	else if (text == "Confirm" && userid == response.userProfile.id && statusid == "editConfirmation"){
		editProperty(message);
		//td.statusid = "mainMenu";
		//response.send(new TextMessage("We have successfully edit the property.",mainMenuKb,null,null,null,3),td);
		const groupKb = {
			"Type": "keyboard",
			"InputFieldState": "hidden",
			"Buttons": [{
			"Text": "<b><font color=\"#000000\">Go back to Main Menu</font></b>",
			"ActionType": "reply",
			"ActionBody": "CANCEL2",
			"BgColor": "#FFAA88",
			"TextOpacity": 100,
			"Rows": 1,
			"Columns": 6
		}]
		};
		response.send(new TextMessage("We have successfully edited the property.", groupKb,null,null,null,4),{
			statusid: "registered",
			userid: response.userProfile.id,
			nameReg: message.trackingData.nameReg,
			groupType: message.trackingData.groupType,
			subGroup: message.trackingData.subGroup
		})
	}

	// Saved Searches of the User (1)
	else if(text == 'Saved Search'  && userid == response.userProfile.id && statusid == "mainAccountStart"){

		if(searchPayload[userid].length == 0){
			response.send(new TextMessage("I'm sorry but you don't have any history to show.", cancel2Kb,null,null,null,4),td);
		} else {
			let num = 0;
			let txt2;
			let msgArray = [];
			let formulaArray =[];
			let recordArray = [];
			for(payload of searchPayload[userid]){
				
				//console.log(payload.fields);
				let condoName = "";
				let rooms = "";
				let minfloor = "";
				let maxfloor = "";
				let minlot = "";
				let maxlot = "";
				let minbudget = "";
				let maxbudget = "";
				let parking = "";
				let furnishing = "";
				let commercial = "";
				let formatdate;
				let createdate;
				if(payload.fields['Location Name'] && payload.fields['Location Name'] != "None"){
					switch (payload.fields["Property Type"]) {
						case "Residential Condo":
							condoName = `Condo Name : ${payload.fields['Location Name']}\n`;
							break;
						case "Office Space":
							condoName = `Building Name : ${payload.fields['Location Name']}\n`;
							break; 
						case "Commercial with Improvements":
							condoName = `Building Name/Area : ${payload.fields['Location Name']}\n`; 
							break;
						case "Residential House & Lot":
							condoName = `Village/Area : ${payload.fields['Location Name']}\n`;
							break;
						case "Industrial with Improvements":
							condoName = `Industrial Park/Area : ${payload.fields['Location Name']}\n`;
							break;
						case "Residential Vacant Lot":
							condoName = `Village/Area : ${payload.fields['Location Name']}\n`;
							break;
						case "Commercial Vacant Lot":
							condoName = `Area : ${payload.fields['Location Name']}\n`;
							break; 
						case "Industrial Vacant Lot":
							condoName = `Industrial Park/Area : ${payload.fields['Location Name']}\n`;
							break;
						case "Raw Land":
							condoName = `Area : ${payload.fields['Location Name']}\n`;
							break;
					}
					  
				}
				if(payload.fields['Number of Rooms'] && payload.fields['Number of Rooms'] != "None"){
					rooms = `Number of Rooms : ${payload.fields['Number of Rooms']}\n`;  
				}

				if(payload.fields['Floor Area Min'] && payload.fields['Floor Area Min'] != "None"){
					minfloor = `Floor Area Min: ${payload.fields['Floor Area Min']}\n`;  
				}
				if(payload.fields['Floor Area Max'] && payload.fields['Floor Area Max'] != "None"){
					maxfloor = `Floor Area Max: ${payload.fields['Floor Area Max']}\n`;  
				}

				if(payload.fields['Lot Area Min'] && payload.fields['Lot Area Min'] != "None"){
					minlot = `Lot Area Min: ${payload.fields['Lot Area Min']}\n`;  
				}
				if(payload.fields['Lot Area Max'] && payload.fields['Lot Area Max'] != "None"){
					maxlot = `Lot Area Max: ${payload.fields['Lot Area Max']}\n`;  
				}				

				if(payload.fields['Commercial Type']){
					rooms = `Commercial Type : ${payload.fields['Commercial Type']}\n`;  
				}

				if(payload.fields['Furnishing']){
					furnishing = `Furnishing : ${payload.fields['Furnishing']}\n`;  
				}

				if(payload.fields['Parking Slots']){
					parking = "Parking: "+payload.fields['Parking Slots'] + "\n";  
				}

				if(payload.fields['Minimum Budget'] && payload.fields['Minimum Budget'] != "None"){
					minbudget = `Minimum Budget: ${payload.fields['Minimum Budget']}\n`;  
				}
				if(payload.fields['Maximum Budget'] && payload.fields['Maximum Budget'] != "None"){
					maxbudget = `Maximum Budget: ${payload.fields['Maximum Budget']}\n`;  
				}
				
				createdate = new Date(payload.fields['Date Created'])
				//console.log(createdate)
				formatdate = (createdate.getMonth() + 1) + "/" + createdate.getDate() + "/" + createdate.getFullYear() ; 
				var locText = payload.fields.Location.replace(',UNKNOWN','').replace(',ALL','');

				txt2 = new TextMessage(`Search: ${num + 1}\n` + 
					`Date Searched : ${formatdate}\n`+
					`Transaction : ${payload.fields['Property Purpose']}\n` +
					`Property Type : ${payload.fields['Property Type']}\n` +
					commercial +
					`Location : ${locText}\n` +
					condoName +
					rooms +
					minfloor +
					maxfloor +
					minlot +
					maxlot +
					furnishing +
					parking +
					minbudget+
					maxbudget);

				msgArray.push(txt2);
				formulaArray[num] = payload.fields["Inquire Formula"];
				recordArray[num] = payload.fields["Record ID"];
				num = num + 1;
			}
			td.formulaArray = formulaArray;
			td.recordArray = recordArray;
			td.statusid = "savedSearchStart";
			msgArray.push(new TextMessage("Please input the search number to repeat search or delete search.", cancel2Kb,null,null,null,3));
			bot.sendMessage(response.userProfile,msgArray,td);
			
		} 

	}

	//matching assistant
	else if(text && text == "Matching Assistant" && userid == response.userProfile.id && statusid == "mainAccountStart"){
		checkIfSubscribed(message,response,td)
	}

	// else if(text && text == "Exact Matches" && userid == response.userProfile.id && statusid == "selectMatches"){
	// 	getExactMatches(message,response,td)		
	// }

	else if(text && text == "Recommended Matches" && userid == response.userProfile.id && statusid == "selectMatches"){
		getRecommendedMatches(message,response,td)		
	}

	//Choice for saved search
	else if (userid == response.userProfile.id && statusid == "savedSearchStart") {
		if(text > td.formulaArray.length){
			response.send(new TextMessage("You have entered an invalid search number. Please choose only among the search numbers presented to you.", cancel2Kb,null,null,null,3),td);
		} else {			
			const choiceKb = {
				"Type": "keyboard",
				"InputFieldState": "hidden",
				"Buttons": [{
					"Columns": 3,
					"Rows": 2,
					"Text": "<font color=\"#494E67\"><b>Repeat Search</b></font>",
					"TextSize": "medium",
					"TextHAlign": "center",
					"TextVAlign": "middle",
					"ActionType": "reply",
					"ActionBody": "Repeat",
					"BgColor": "#edbf80",
				}, {
					"Columns": 3,
					"Rows": 2,
					"Text": "<font color=\"#494E67\"><b>Delete Search</b></font>",
					"TextSize": "medium",
					"TextHAlign": "center",
					"TextVAlign": "middle",
					"ActionType": "reply",
					"ActionBody": "Delete search",
					"BgColor": "#c7b0e6",
				}, {
					"Text": "<b><font color=\"#000000\">BACK TO MAIN MENU</font></b>",
					"ActionType": "reply",
					"ActionBody": "CANCEL2",
					"BgColor": "#FFAA88",
					"TextOpacity": 100,
					"Rows": 1,
					"Columns": 6
				}]
			};

			td.searchNumber = text
			td.statusid = "choiceSavedSearch";
			response.send(new TextMessage("Would you like to search again or delete search number " + text + "?", choiceKb,null,null,null,3),td);
		}		
	}

	//Delete Saved Search (1)
	else if (text == "Delete search" && userid == response.userProfile.id && statusid == "choiceSavedSearch") {
		td.recordDelete = td.recordArray[parseInt(td.searchNumber,10)-1];
		console.log(td.recordDelete)
		td.statusid = "deleteSearch";
		response.send(new TextMessage("Are you sure you want to delete search number " + td.searchNumber + "?", confirm2Kb,null,null,null,3),td);
	}

	//Delete Saved Search Confirmation(2)
	else if (text == "Confirm" && userid == response.userProfile.id && statusid == "deleteSearch") {
		deleteSavedSearch(message)
		//td.statusid = "mainMenu";
		//response.send(new TextMessage("We have successfully deleted that search history.",mainMenuKb,null,null,null,3),td);
		const groupKb = {
			"Type": "keyboard",
			"InputFieldState": "hidden",
			"Buttons": [{
			"Text": "<b><font color=\"#000000\">Go back to Main Menu</font></b>",
			"ActionType": "reply",
			"ActionBody": "CANCEL2",
			"BgColor": "#FFAA88",
			"TextOpacity": 100,
			"Rows": 1,
			"Columns": 6
		}]
		};
		response.send(new TextMessage("We have successfully deleted that search history.", groupKb,null,null,null,4),{
			statusid: "registered",
			userid: response.userProfile.id,
			nameReg: message.trackingData.nameReg,
			groupType: message.trackingData.groupType,
			subGroup: message.trackingData.subGroup
		})
	}


	// Saved Searches of the User (2)
	else if (text == "Repeat" && userid == response.userProfile.id && statusid == "choiceSavedSearch") {
		const formula = td.formulaArray[parseInt(td.searchNumber,10)-1];
		console.log(formula);
		showInquire2(userid,formula);
		td.statusid = "newSearch";
		response.send(new TextMessage("Proceed with new search.", proceedKb,null,null,null,3),td);
	}

	// Saved Searches of the User (3)
	else if (text == "Proceed" && userid == response.userProfile.id && statusid == "newSearch") {
		if ((inquirePayload[userid] && inquirePayload[userid].length == 0) || !(inquirePayload[userid])){
			response.send(new TextMessage("I'm sorry but there is nothing that matches your inquiry.", cancel2Kb,null,null,null,4),td);
		} else {
			let num = 0;
			let number = 0;
			let action = [];
			let msgArray = [];
			for(payload of inquirePayload[userid]){
				action[num] = {
					//"Property" : num+1,
					//"Property ID": payload.fields["Suggested Property ID"],
					//"Property Summary" : payload.fields["Result Header"],
					"Transaction" : payload.fields["Property Purpose"],
					"Property Type" : payload.fields["Property Type"],
					//"Condo/Area/Building Name": payload.fields['Location Name'],
					//"Location" : payload.fields['Location']
				}

				if(payload.fields["Property Type"] == "Commercial with Improvements"){
					action[num]["Commercial Type"] = payload.fields['Commercial Type'];
				}

				action[num]["Location"] = payload.fields['Location'];


				switch (payload.fields["Property Type"]) {
					case "Residential Condo":
						action[num]["Condo Name"] = payload.fields['Location Name'];
						break;
					case "Office Space":
						action[num]["Building Name"] = payload.fields['Location Name'];	
						break; 
					case "Commercial with Improvements": 
						action[num]["Building Name/Area"] = payload.fields['Location Name'];
						break;
					case "Residential House & Lot":
						action[num]["Village/Area"] = payload.fields['Location Name'];
						break;
					case "Industrial with Improvements":
						action[num]["Industrial Park/Area"] = payload.fields['Location Name'];	
						break;
					case "Residential Vacant Lot":
						action[num]["Village/Area"] = payload.fields['Location Name'];
						break;
					case "Commercial Vacant Lot":
						action[num]["Area"] = payload.fields['Location Name'];
						break; 
					case "Industrial Vacant Lot":
						action[num]["Industrial Park/Area"] = payload.fields['Location Name'];
						break;
					case "Raw Land":
						action[num]["Area"] = payload.fields['Location Name'];
						break;
				}
				if(payload.fields['Number of Rooms'] && payload.fields['Number of Rooms'] != 0){
					action[num]["Number of Rooms"] = payload.fields['Number of Rooms'];
				}

				if(payload.fields.Furnishing){
					action[num]["Furnishing"] = payload.fields['Furnishing'];
				}
				if(payload.fields['Lot Area'] && payload.fields['Lot Area'] != 0){
					action[num]["Lot Area"] = payload.fields['Lot Area'] + " sqm";
				}
				if(payload.fields['Floor Area'] && payload.fields['Floor Area'] != 0){
					action[num]["Floor Area"] = payload.fields['Floor Area'] + " sqm";
				}
				if(payload.fields['Parking Slots']){
					action[num]["Parking Slots"] = payload.fields['Parking Slots'];
				}
				
				action[num]["Price"] = payload.fields['Price2'];
				
				if(payload.fields['Property Detail']){
					action[num]["Property Detail"] = payload.fields['Property Detail'];
				}
				
				///
				action[num]["Viber ID"] = payload.fields['Viber ID'];
				action[num]["Sub Group"] = payload.fields['Sub Group'];
				action[num]["Suggested"] = payload.fields['Suggested'];
				action[num]["Suggested Client"] = payload.fields['Suggested Client'];
				///

				action[num]["Images"] = []
				if (payload.fields['Property Image1']) {
					action[num]["Images"].push(payload.fields['Property Image1']);
				}
				if (payload.fields['Property Image2']) {
					action[num]["Images"].push(payload.fields['Property Image2']);
				}
				if (payload.fields['Property Image3']) {
					action[num]["Images"].push(payload.fields['Property Image3']);
				}
				if (payload.fields['Property Image4']) {
					action[num]["Images"].push(payload.fields['Property Image4']);
				}
				if (payload.fields['Property Image5']) {
					action[num]["Images"].push(payload.fields['Property Image5']);
				}
				action[num]["Property ID"] = payload.fields["Suggested Property ID"];

				num = num + 1;
			}

			let richView = {
				"ButtonsGroupColumns": 6,
				"ButtonsGroupRows": 7,
				"BgColor": "#FFFFFF",
				"Buttons": []
			};
			let attach = {};
			let attach3 = {};
			let attach2 = {};
			let textUri = "";
			let counter = 0;
			let summary = "";
			if(td.groupType == "Broker"){
				summary = "Suggested"
			}else{
				summary = "Suggested Client"
			}
			let text = "";
			let arrayer = [];
			let textSummary = "";
			(async () => {
				for(values of action){
					
					number = number + 1;
					counter = counter + 1;
					
					/*
					attach = {
						"ActionBody": "none",
						"Text": "Property " + counter,
						"Silent": "true",
						"Rows": 1,
						"Columns": 6
					}
					richView.Buttons.push(attach);
					*/
	
					
					if(values["Sub Group"] == "Client" || values["Sub Group"] == "Admin"){
						////////
						//text = "Dee Chan, PRC 19147 \n09171727788; chan@gmail.com"
						try {
						
							if(values["Sub Group"] == "Admin") {
								const query = await airTableCredentials.read({
									filterByFormula: `{ID} = "recq1P9ND0tU7pFjt"`
								});
								text = query[0].fields["Summary"]
	
								delete values["Sub Group"]
								delete values["Viber ID"]
								textSummary = values[summary]
								delete values["Suggested"]
								delete values["Suggested Client"]

								values["Contact Information"] = text
							}
							
							text = "Reach out to an NREA Broker for more details."

							arrayer = [values];
							textUri = `proptechph.com/display.html?payload=` + encodeURIComponent(JSON.stringify(arrayer));
							attach2 = {
								"ActionBody": textUri,
								"Text": textSummary.replace(/\n/g, "<br>"),
								"ActionType": "open-url",
								"OpenURLType": "internal",
								"Silent": "true",
								//"TextShouldFit": "true",
								"TextSize" : "small",
								"TextHAlign": "left",
								"TextVAlign": "top",
								"Rows": 5,
								"Columns": 6
							}
							richView.Buttons.push(attach2);		
							attach3 = {
								"ActionBody": "none",
								"Text": text,
								"Silent": "true",
								"TextSize" : "small",
								"TextHAlign": "left",
								"BgColor": "#C1E7E3",
								"Rows": 2,
								"Columns": 6
							}
							richView.Buttons.push(attach3);
						} catch (error) {
							console.error(error)
						}
	
					} else if(values["Sub Group"] == "HLURB"){
						try {
							const query = await airTableHLURB.read({
								filterByFormula: `{Viber ID} = "${values["Viber ID"]}"`
							});
							//text = query[0].fields["Profile Summary"]
							const query2 = await airTableCredentials.read({
								filterByFormula: `{ID} = "recq1P9ND0tU7pFjt"`
							});
			
							if(query.length != 0){
								text = query[0].fields["Profile Summary"]
							} else {
								text = query2[0].fields["Summary"]
							}

							delete values["Sub Group"]
							delete values["Viber ID"]
							textSummary = values[summary]
							delete values["Suggested"]
							delete values["Suggested Client"]
							values["Contact Information"] = text
		
							arrayer = [values];
							textUri = `proptechph.com/display.html?payload=` + encodeURIComponent(JSON.stringify(arrayer));
							attach2 = {
								"ActionBody": textUri,
								"Text": textSummary.replace(/\n/g, "<br>"),
								"ActionType": "open-url",
								"OpenURLType": "internal",
								"Silent": "true",
								//"TextShouldFit": "true",
								"TextSize" : "small",
								"TextHAlign": "left",
								"TextVAlign": "top",
								"Rows": 5,
								"Columns": 6
							}
							richView.Buttons.push(attach2);		
							attach3 = {
								"ActionBody": "none",
								"Text": text,
								"Silent": "true",
								"TextSize" : "small",
								"TextHAlign": "left",
								"BgColor": "#C1E7E3",
								"Rows": 2,
								"Columns": 6
							}
							richView.Buttons.push(attach3);	
						} catch (error) {
							console.error(error)
						}
						
					} else if(values["Sub Group"] == "PRC"){
						try {
							const query = await airTablePRC.read({
								filterByFormula: `{Viber ID} = "${values["Viber ID"]}"`
							});
							//text = query[0].fields["Profile Summary"]
							const query2 = await airTableCredentials.read({
								filterByFormula: `{ID} = "recq1P9ND0tU7pFjt"`
							});
			
							if(query.length != 0){
								text = query[0].fields["Profile Summary"]
							} else {
								text = query2[0].fields["Summary"]
							}
							
							delete values["Sub Group"]
							delete values["Viber ID"]
							textSummary = values[summary]
							delete values["Suggested"]
							delete values["Suggested Client"]
							values["Contact Information"] = text
		
							arrayer = [values];
							textUri = `proptechph.com/display.html?payload=` + encodeURIComponent(JSON.stringify(arrayer));
							attach2 = {
								"ActionBody": textUri,
								"Text": textSummary.replace(/\n/g, "<br>"),
								"ActionType": "open-url",
								"OpenURLType": "internal",
								"Silent": "true",
								//"TextShouldFit": "true",
								"TextSize" : "small",
								"TextHAlign": "left",
								"TextVAlign": "top",
								"Rows": 5,
								"Columns": 6
							}
							richView.Buttons.push(attach2);
							attach3 = {
								"ActionBody": "none",
								"Text": text,
								"Silent": "true",
								"TextSize" : "small",
								"TextHAlign": "left",
								"BgColor": "#C1E7E3",
								"Rows": 2,
								"Columns": 6
							}
							richView.Buttons.push(attach3);	
						} catch (error) {
							console.error(error)
						}
					}
	
					if(number == 4){
						msgArray.push(new RichMediaMessage(richView,null,null,null,null,6))
						richView = {
							"ButtonsGroupColumns": 6,
							"ButtonsGroupRows": 7,
							"BgColor": "#FFFFFF",
							"Buttons": []
						};
						attach = {};
						attach2 = {};
						attach3 = {};
						number = 0;
						text = "";
						arrayer = [];
					} else if (counter == action.length) {
						console.log(richView)
						msgArray.push(new RichMediaMessage(richView,null,null,null,null,6))
					}
					
				}
			//td.statusid = "mainMenu";
			const groupKb = {
				"Type": "keyboard",
				"InputFieldState": "hidden",
				"Buttons": [{
				"Text": "<b><font color=\"#000000\">Go back to Main Menu</font></b>",
				"ActionType": "reply",
				"ActionBody": "CANCEL2",
				"BgColor": "#FFAA88",
				"TextOpacity": 100,
				"Rows": 1,
				"Columns": 6
			}]
			};
			
			msgArray.push(new TextMessage("End of Listings. "));
			msgArray.push(new TextMessage("Congratulations! There are matched properties for your search.", groupKb,null,null,null,6));
			bot.sendMessage(response.userProfile,msgArray,{
				statusid: "registered",
				userid: response.userProfile.id,
				nameReg: message.trackingData.nameReg,
				groupType: message.trackingData.groupType,
				subGroup: message.trackingData.subGroup
			});
			})();
		}
	}

	//Referral Code
	else if (text == "Referral Code" && userid == response.userProfile.id && statusid == "mainAccountStart"){
		const txt = "This is a referral code you can share to your friends and relatives:\n" + makeid(6);
		td.statusid = "mainMenu";
		response.send(new TextMessage(txt, cancel2Kb,null,null,null,4),td);
	}

	else if(text == "Salesperson" && userid == response.userProfile.id && statusid == "mainAccountStart"){
		salesperson(message, response);

	}
	//Confirm Salesperson
	else if(text == "Supervision" && userid == response.userProfile.id && statusid == "mainAccountStart"){
		
		if(supervisionPayload[userid].length == 0){
			response.send(new TextMessage("I'm sorry but you have no people under you.", cancel2Kb,null,null,null,4),td);
		} else {
			let num = 0;
			let txt2;
			let pict;
			let msgArray = [];
			let codeArray = [];
			let formatdate;
			let createdate;
			let hlurbdate;
			let formathlurbdate;
			for(payload of supervisionPayload[userid]){
				console.log(payload.fields);
				createdate = new Date(payload.fields['Date Registered'])
				hlurbdate = new Date(payload.fields['HLURB/PRC Expiration'])
				formathlurbdate = (hlurbdate.getMonth() + 1) + "/" + hlurbdate.getDate() + "/" + hlurbdate.getFullYear() 
				formatdate = (createdate.getMonth() + 1) + "/" + createdate.getDate() + "/" + createdate.getFullYear();
				txt2 = new TextMessage(`User Number: ${num + 1}\n` + 
					`Name : ${payload.fields.Name}\n` +
					`Mobile : ${payload.fields.Mobile}\n` +
					`Email : ${payload.fields.Email}\n` +
					//`Referral : ${payload.fields.Referral}\n` +
					`DHSUD : ${payload.fields['HLURB/PRC']}\n` +
					// `DHSUD Expiration : ${formathlurbdate}\n` +
					`Supervisor : ${payload.fields.Supervisor}\n` +
					`Supervisor PRC : ${payload.fields['Supervisor PRC']}\n` +
					`Date Registered : ${formatdate}\n` +
					`Validated : ${payload.fields.Validated}\n`);
				msgArray.push(txt2);
				if (payload.fields['HLURB/PRC Image']) {
					pict = new PictureMessage(payload.fields['HLURB/PRC Image'][0].url);
					msgArray.push(pict);
				}
				codeArray[num] = payload.fields["Viber ID"];
				num = num + 1;
			}
			td.codeArrayValidate = codeArray;
			td.statusid = "supervision";
			const cancelKb = {
				"Type": "keyboard",
				//"InputFieldState": "hidden",
				"Buttons": [{
					"Text": "<b><font color=\"#000000\">GO BACK TO MENU</font></b>",
					"ActionType": "reply",
					"ActionBody": "CANCEL2",
					"BgColor": "#FFAA88",
					"TextOpacity": 100,
					"Rows": 1,
					"Columns": 6
				}]
			};
			msgArray.push(new TextMessage("Do you want to validate people under you? You can do this by sending his/her user number.", cancelKb,null,null,null,3));
			bot.sendMessage(response.userProfile,msgArray,td);
		}
	}

	//Validate User under the broker (Confirmation)
	else if(isNaN(text) == false && userid == response.userProfile.id && statusid == "supervision"){
		if(text > td.codeArrayValidate.length){
			response.send(new TextMessage("You have entered an invalid user number. Please choose only among the user numbers presented to you.", cancel2Kb,null,null,null,4),td);
		} else {
			td.confirmCodeValidate = td.codeArrayValidate[parseInt(text,10)-1];
			td.statusid = "supervisionConfirmation";
			const textConfirm = "Do you confirm this person to be working under you? Please be aware that under RESA Law R.A. 9646 Section 31," + 
				" you should have full direct supervision and accountability of him/her. Your name and PRC License No. will also appear in posts he/she submits to this group."
			response.send(new TextMessage(textConfirm, confirm2Kb,null,null,null,4),td);
		}
	}

	//Validate User
	else if(text == "Confirm" && userid == response.userProfile.id && statusid == "supervisionConfirmation"){
		changeSupervision(message);
		//response.send(new TextMessage("We have updated his/her status.", cancel2Kb,null,null,null,4),td);
		const groupKb = {
			"Type": "keyboard",
			"InputFieldState": "hidden",
			"Buttons": [{
			"Text": "<b><font color=\"#000000\">Go back to Main Menu</font></b>",
			"ActionType": "reply",
			"ActionBody": "CANCEL2",
			"BgColor": "#FFAA88",
			"TextOpacity": 100,
			"Rows": 1,
			"Columns": 6
		}]
		};
		response.send(new TextMessage("We have updated his/her status.", groupKb,null,null,null,4),{
			statusid: "registered",
			userid: response.userProfile.id,
			nameReg: message.trackingData.nameReg,
			groupType: message.trackingData.groupType,
			subGroup: message.trackingData.subGroup
		})
	}

	//Invalidate or Remove User
	else if(text == "Remove" && userid == response.userProfile.id && statusid == "mainAccountStart"){
		
		if(validatedPayload[userid].length == 0){
			response.send(new TextMessage("I'm sorry but you have no people under you.", cancel2Kb,null,null,null,4),td);
		} else {
			let num = 0;
			let txt2;
			let pict;
			let msgArray = [];
			let codeArray = [];
			let createdate;
			let formatdate;
			let hlurbdate;
			let formathlurbdate;
			for(payload of validatedPayload[userid]){
				console.log(payload.fields);
				createdate = new Date(payload.fields['Date Registered'])
				hlurbdate = new Date(payload.fields['HLURB/PRC Expiration'])
				formathlurbdate = (hlurbdate.getMonth() + 1) + "/" + hlurbdate.getDate() + "/" + hlurbdate.getFullYear() 
				formatdate = (createdate.getMonth() + 1) + "/" + createdate.getDate() + "/" + createdate.getFullYear();

				txt2 = new TextMessage(`User Number: ${num + 1}\n` + 
					`Name : ${payload.fields.Name}\n` +
					`Mobile : ${payload.fields.Mobile}\n` +
					`Email : ${payload.fields.Email}\n` +
					//`Referral : ${payload.fields.Referral}\n` +
					`DHSUD : ${payload.fields['HLURB/PRC']}\n` +
					// `DHSUD Expiration : ${formathlurbdate}\n` +
					`Supervisor : ${payload.fields.Supervisor}\n` +
					`Supervisor PRC : ${payload.fields['Supervisor PRC']}\n` +
					`Date Registered : ${formatdate}\n` +
					`Validated : ${payload.fields.Validated}\n`);
				msgArray.push(txt2);
				if (payload.fields['HLURB/PRC Image']) {
					pict = new PictureMessage(payload.fields['HLURB/PRC Image'][0].url);
					msgArray.push(pict);
				}
				codeArray[num] = payload.fields["Viber ID"];
				num = num + 1;
			}
			td.codeArray = codeArray;
			td.statusid = "removeUser";
			msgArray.push(new TextMessage("Do you want to remove people under you? You can do this by sending his/her user number.", cancel2Kb,null,null,null,3));
			bot.sendMessage(response.userProfile,msgArray,td);
		}
	}

	//Remove user from broker (Confirmation)
	else if(isNaN(text) == false && userid == response.userProfile.id && statusid == "removeUser"){
		if(text > td.codeArray.length){
			response.send(new TextMessage("You have entered an invalid user number. Please choose only among the user numbers presented to you.", cancel2Kb,null,null,null,4),td);
		} else {
			td.confirmCode = td.codeArray[parseInt(text,10)-1];
			td.statusid = "removeUserSupervision";
			const textConfirm = "Are you sure you want to remove this salesperson? This action cannot be undone."
			response.send(new TextMessage(textConfirm, confirm2Kb,null,null,null,4),td);
		}
	}

	//Removed user
	else if(text == "Confirm" && userid == response.userProfile.id && statusid == "removeUserSupervision"){
		removeSupervision(message);
		//response.send(new TextMessage("We have updated and remove his/her access.", cancel2Kb,null,null,null,4),td);
		const groupKb = {
			"Type": "keyboard",
			"InputFieldState": "hidden",
			"Buttons": [{
			"Text": "<b><font color=\"#000000\">Go back to Main Menu</font></b>",
			"ActionType": "reply",
			"ActionBody": "CANCEL2",
			"BgColor": "#FFAA88",
			"TextOpacity": 100,
			"Rows": 1,
			"Columns": 6
		}]
		};
		response.send(new TextMessage("We have updated and removed his/her access.", groupKb,null,null,null,4),{
			statusid: "registered",
			userid: response.userProfile.id,
			nameReg: message.trackingData.nameReg,
			groupType: message.trackingData.groupType,
			subGroup: message.trackingData.subGroup
		})
	}

	//bot web
	else if(text == botName+'BotWeb' && userid == response.userProfile.id && statusid == "mainAccountStart"){
		// td.statusid = 'ParebBotWeb';
		sendBotWeb(message, response, td);		
	}

	else if(text == 'aeloop' && userid == response.userProfile.id && statusid == "mainAccountStart"){
		// td.statusid = 'ParebBotWeb';
		aeloop(message, response, td);		
	}

	//Feedback
	else if(text == 'Feedback' && userid == response.userProfile.id && statusid == "mainAccountStart"){
		td.statusid = 'feedback';
		response.send(new TextMessage("I would love to her your suggestions and I promise to improve! Please please, leave me a message here.", cancel2Kb,null,null,null,4),td);	
	}

	//Feedback Done
	else if(text && userid == response.userProfile.id && statusid == "feedback"){
		feedBackSend(message,response);
		const groupKb = {
			"Type": "keyboard",
			"InputFieldState": "hidden",
			"Buttons": [{
			"Text": "<b><font color=\"#000000\">Go back to Main Menu</font></b>",
			"ActionType": "reply",
			"ActionBody": "CANCEL2",
			"BgColor": "#FFAA88",
			"TextOpacity": 100,
			"Rows": 1,
			"Columns": 6
		}]
		};
		response.send(new TextMessage("Thank you for the feedback!", groupKb,null,null,null,4),{
			statusid: "registered",
			userid: response.userProfile.id,
			nameReg: message.trackingData.nameReg,
			groupType: message.trackingData.groupType,
			subGroup: message.trackingData.subGroup
		})
	}


	//When all else fails

	else if(text == "CANCEL2"){
		mainMenu(message,response);
	}

	else if (text && text.toUpperCase() == "MENU"){
		mainMenu(message,response);
	}


});
