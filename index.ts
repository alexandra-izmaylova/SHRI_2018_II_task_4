import express from 'express';
import fs from 'fs';
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const VALID_EVENT_TYPES = ['critical', 'info'];

let time = new Date();
let startTime = time.getTime();

const format = (time: number) => {
	time = Math.floor(time / 1000);
	const hh = Math.floor(time / 3600)
		.toString()
		.padStart(2, '0');
	const mm = Math.floor((time % 3600) / 60)
		.toString()
		.padStart(2, '0');
	const ss = ((time % 3600) % 60).toString().padStart(2, '0');
	return `${hh}:${mm}:${ss}`;
};

app.get('/status', (_, res) => {
	const workTime = new Date().getTime() - startTime;
	res.send(format(workTime));
});

interface Event {
	type: string;
}

const sendEvents = (
	res: express.Response,
	type: string,
	page: number,
	size: number
) => {
	fs.readFile('events.json', 'utf8', (_, data) => {
		const input = JSON.parse(data);

		page = page || 1;
		size = size || input.events.length;

		if (type) {
			const t = type.split(':');

			if (t.some(e => !VALID_EVENT_TYPES.includes(e))) {
				return res.status(400).send('incorrect type');
			} else {
				input.events = input.events.filter(
					(event: Event) => t.indexOf(event.type) != -1
				);
			}
		}

		const startIndex = (page - 1) * size;
		const endIndex = Math.min(input.events.length, page * size);
		let events = [];

		for (let i = startIndex; i < endIndex; i++) {
			events.push(input.events[i]);
		}
		input.events = events;

		return res.send(input);
	});	
};

app.get('/api/events', (req, res) => {
	const type = req.query.type;
	const page = req.query.page;
	const size = req.query.size;
	sendEvents(res, type, page, size);
});

app.post('/api/events', (req, res) => {
	const type = req.body.type;
	const page = req.body.page;
	const size = req.body.size;
	sendEvents(res, type, page, size);
});

app.get('*', (_, res) => res.status(404).send('<h1>Page not found</h1>'));

app.listen(8000);
