import express = require('express');
const app = express();
import fs = require('fs');

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));


const VALID_EVENT_TYPES = ['critical', 'info'];

let time = new Date();
let startTime = time.getTime();

const format = (time: number) => {
	time = Math.floor(time / 1000);
	const hh = Math.floor(time / 3600).toString().padStart(2, '0');
	const mm = Math.floor((time % 3600) / 60).toString().padStart(2, '0');
	const ss = ((time % 3600) % 60).toString().padStart(2, '0');
	return `${hh}:${mm}:${ss}`;
};


app.get('/status', (_, res) => {
	const workTime = new Date().getTime() - startTime;
	res.send(format(workTime));
});

const sendEvents = (res: Response, type: string, page: number, size: number) => {
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


