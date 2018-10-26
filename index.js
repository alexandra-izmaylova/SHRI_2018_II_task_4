define(["require", "exports", "express", "fs"], function (require, exports, express, fs) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    var VALID_EVENT_TYPES = ['critical', 'info'];
    var time = new Date();
    var startTime = time.getTime();
    var format = function (time) {
        time = Math.floor(time / 1000);
        var hh = Math.floor(time / 3600).toString().padStart(2, '0');
        var mm = Math.floor((time % 3600) / 60).toString().padStart(2, '0');
        var ss = ((time % 3600) % 60).toString().padStart(2, '0');
        return hh + ":" + mm + ":" + ss;
    };
    app.get('/status', function (_, res) {
        var workTime = new Date().getTime() - startTime;
        res.send(format(workTime));
    });
    var sendEvents = function (res, type, page, size) {
        var input = JSON.parse(fs.readFileSync('events.json', 'utf8'));
        page = page || 1;
        size = size || input.events.length;
        if (type) {
            var t_1 = type.split(':');
            if (t_1.some(function (e) { return VALID_EVENT_TYPES.indexOf(e) == -1; })) {
                res.status(400).send("incorrect type");
                return;
            }
            else {
                input.events = input.events.filter(function (event) { return t_1.indexOf(event.type) != -1; });
            }
        }
        var startIndex = (page - 1) * size;
        var endIndex = Math.min(input.events.length, page * size);
        var events = [];
        for (var i = startIndex; i < endIndex; i++) {
            events.push(input.events[i]);
        }
        input.events = events;
        res.send(input);
    };
    app.get('/api/events', function (req, res) {
        var type = req.query.type;
        var page = req.query.page;
        var size = req.query.size;
        sendEvents(res, type, page, size);
    });
    app.post('/api/events', function (req, res) {
        var type = req.body.type;
        var page = req.body.page;
        var size = req.body.size;
        sendEvents(res, type, page, size);
    });
    app.get('*', function (_, res) { return res.status(404).send("<h1>Page not found</h1>"); });
    app.listen(8000);
});
