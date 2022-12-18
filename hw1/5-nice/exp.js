const http = require('http');
const clients = [];
const bets = [];

const server = http.createServer(function(request, response){
	switch(request.url){
		case '/':
			mainPage(request, response);
			break;
		case '/bet':
			betPage(request, response);
			break;
		case '/secret':
			secretPage(request, response);
			break;
		default:
			response.writeHead(404);
			response.end('Page not found');
	}
});

server.listen(3000);

function mainPage(request, response){
	clients.push({ request, response });
	response.writeHead(200);
	response.on('close',() => cleanClient(response));
}

function betPage(request, response){
	bets.push(Math.random());
	sendBetsForAll();
	response.writeHead(200);
	response.end('done');
}

function secretPage(request, response){
	// check admin credentials
	response.write(JSON.stringify(clients.map(client => client.request.ip)));
	response.end('-----');
}

function sendBetsForAll(){
	clients.forEach(client => client.response.end(JSON.stringify(bets)));
}

function cleanClient(response){
	let ind = clients.findIndex(client => client.response === response);

	if(ind !== -1){
		clients.splice(ind, 1);
	}
}