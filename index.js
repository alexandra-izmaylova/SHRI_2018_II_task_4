const express = require('express');
const app = express();
const fs = require('fs');

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));


const VALID_EVENT_TYPES = ['critical', 'info'];

var current_page = 1;
var records_per_page = 2;

let time = new Date();
let startTime = time.getTime();

const toMillis = (time) => {
	var tmp = time.split(':');
	const h = parseInt(tmp[0]);
	const m = parseInt(tmp[1]);
	const s = parseInt(tmp[2]);
	return (h*3600 + m*60 + s)*1000;
};

// Функция которая принимает время в мс и возвращает строку в формате хх:мм:сс
const format = (time) => {
	time = Math.floor(time / 1000);
	const hh = Math.floor(time / 3600).toString().padStart(2, '0');
	const mm = Math.floor((time % 3600) / 60).toString().padStart(2, '0');
	const ss = ((time % 3600) % 60).toString().padStart(2, '0');
	return `${hh}:${mm}:${ss}`;
};

//console.log(format(toMillis('199:00:00')));


app.get('/status', (_, res) => {
	const workTime = new Date().getTime() - startTime;
	res.send(format(workTime));
});

const sendEvents = (res, type, page, size) => {
	const input = JSON.parse(fs.readFileSync('events.json', 'utf8'));

	page = page || 1;
	size = size || input.events.length;

	if(type) {
		const t = type.split(':');

		if(t.some(e => VALID_EVENT_TYPES.indexOf(e) == -1)) {
			res.status(400).send("incorrect type");
			return;
		}
		else {
			input.events = input.events.filter(event => t.indexOf(event.type) != -1);
		}
	}

	const startIndex = (page - 1) * size;
	const endIndex = Math.min(input.events.length, page * size);
	let events = [];

	for(let i = startIndex; i < endIndex; i++) {
		events.push(input.events[i]); 
	}	
	input.events = events;

	res.send(input);
}



app.get('/api/events', (req, res) => {
	const type = req.query.type;
	const page = req.query.page;
	const size = req.query.size;
	sendEvents(res, type, page, size);
});

app.post('/api/events', (req,res) => {
	const type = req.body.type;
	const page = req.body.page;
	const size = req.body.size;
	sendEvents(res, type, page, size);
});

app.get('*', (_, res) => res.status(404).send("<h1>Page not found</h1>"));


app.listen(8000);


