import http from 'http';
import { readFile } from 'fs';

const DOMAIN = 'localhost';
const PROTOCOL = 'http';
const PORT = 3000;
const ORIGIN = `${PROTOCOL}://${DOMAIN}:${PORT}`;  // если порт стандартный 80-й, его "приклеивать" в origin не нужно


const clients = [];
const bets = [];

const server = http.createServer(function(request, response){
	const parsedUrl = new URL(request.url, ORIGIN);  // парсим url
	console.log(parsedUrl);
	switch(parsedUrl.pathname){
		case '/':
			mainPage(request, response, parsedUrl);
			break;
		case '/bets':
			betsStream(request, response, parsedUrl);
			break;
		default:
			response.writeHead(404);
			response.end('Page not found');
	}
});
console.log('ella');

server.listen(3000);

function mainPage(request, response, parsedUrl){
	readFile('./index.html', (err, buffer) => {  // хостим (читаем) index.html
		if (err !== null) {  // обязательно делаем проверку на ошибку, мало ли что не так с файлом
			response.writeHead(500);
			response.end(error);
			// logs
		} else {
		response.end(buffer.toString());
		}
	})
	/*
	readFile('./index.html', `utf8`, (err, data) => {
		if (err) {
			console.error(err)
			return
		}
		response.writeHeader(200, {"Content-Type": "text/html"});  
    response.write(data);  
    response.end();  
	})
	*/
	// response.end('todo');
}

function betsStream(request, response, parsedUrl){
	const fromId = parseInt(parsedUrl.searchParams.get('id') ?? '0');  // получаем значение id из параметров url после знака "?"
	console.log(fromId);
	const client = { request, response };
	let immediatellyBets = bets.filter(bet => bet.id > fromId); // ставки, которые отдаем клиенту немедленно, без long polling, т.е. все ставки id которых больше fromid
	if (immediatellyBets.length > 0) { // если есть хотя бы одна такая ставка, 
		sendBetsToClient(client, bets);  // отдаем их клиенту
	} else {  // если нет, 
		clients.push(client); // добавляем клиента в массив ожидающих клиентов
		response.on('close', () => cleanClient(response));  // подписываемся на response и клиента выкидываем по закрытию респонса
	}
}
function sendBetsToClient(client, bets) {  // отдаем клиенту все имеющиеся на сервере ставки
	client.response.end(JSON.stringify(bets));
}

function cleanClient(response){
	let ind = clients.findIndex(client => client.response === response);

	if(ind !== -1){
		clients.splice(ind, 1);
	}
}
function randomBet(){
	setTimeout(() => {
		let id = bets.length > 0 ? bets[bets.length - 1].id : 0;
		++id;
		let bet = { id, value: id * 1000, time: Date.now() };
		bets.push(bet);
		clients.forEach(client => sendBetsToClient(client, [bet])); // рассылаем ставки по всем клиентам в режиме long polling, отдаем клиенту именно последнюю ставку
		randomBet();
	}, 1000 * ( Math.floor(Math.random() * 20) + 20 ));
}

randomBet();