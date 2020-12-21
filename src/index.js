const express = require('express');
require('./db/mongoose');
const userRouter = require('./routers/user');
const tasksRouter = require('./routers/tasks');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(userRouter);
app.use(tasksRouter);

app.listen(port, () => {
	console.log(`Server is up and running on port ${port}`);
});
