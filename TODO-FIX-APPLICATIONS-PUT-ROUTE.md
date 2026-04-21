# TODO: Fix PUT /applications/:id/messages/read-all route

## Issue

messageController.markAppAllRead is undefined at module load time in applications.js despite proper export.

## Steps

1. [x] Comment out route to test server start
2. [] Test npm start
3. [] Add dummy callback (req, res) => res.json({ok:true})
4. [] Read server/models/Message.js for circular deps
5. [] Move markAppAllRead to applicationActionController.js
6. [] Update route to use applicationActionController.markAppAllRead

## Current status

Server should start now with this route disabled.
