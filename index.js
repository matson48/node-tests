// -------------------------------------------------------------------
//                             Boilerplate
// -------------------------------------------------------------------

// Import packages
const express = require("express"),
      application = express(),
      body_parser = require("body-parser"),
      MySQL = require("mysql"),
      node_cleanup = require("node-cleanup");

// Hack around express.js not supporting mustache.js, the most obvious
// mustache template engine.
// 
// I'm not particularly attached to Mustache, I just figured getting
// it to work would be a good excuse to learn more about how Node.js
// and Express work.
(function () {
    // Put in its own context to hide our shame

    // Privately import modules (it's not a problem if you include
    // either of these outside---`const` and `let` let you shadow
    // variables pretty wantonly)
    const filesystem = require("fs"),
          mustache = require("mustache");

    // Register mustache with express
    application.engine("mustache", (path, variables, callback) => {
        filesystem.readFile(path, "utf8", (error, content) => {
            if (error) return callback(error);

            // I think this helps mustache cache the template (it may
            // automatically do this after the first call to 'render',
            // though)
            mustache.parse(content);
    
            return callback(null, 
                            mustache.render(content, variables));
        });
    });
})();

// Start initialization process
console.log("Application starting!");

// Set express.js settings
application.set("view engine", "mustache");

// Specify body parsing package, because by default Express has no way
// of interpreting any of the data in GET and POST requests
application.use(body_parser.urlencoded({extended: false}));
application.use(body_parser.json()); // Could be useful

// Connect to database
const connection = MySQL.createConnection({
    host: "localhost",
    user: "user",
    password: "password",
    database: "node_tests"
});

connection.connect((error) => {
    if (error) {
        console.error("MySQL connection error: ", error.stack);
        return;
    }

    // Not sure if the thread id's ever helpful, but the example has it
    console.log("Connected to MySQL database as id ", 
                connection.threadId);
});

// Disconnect from database when Node ends
node_cleanup((exit_code, signal) => {
    connection.end((error) => {
        if (error) {
            console.error("MySQL disconnection error: ", error.stack);
        }

        console.log("Disconnected from database!");
    });
    // (This may never actually execute. The message never
    //  displays. Look into that.)

    console.log("Application ending!");
});

// -------------------------------------------------------------------
//                            Actual pages
// -------------------------------------------------------------------

// Implement main screen
let seen_amount = 0;
application.get("/", (request, response) => {
    seen_amount += 1;
    response.render("index", {amount: seen_amount});
});

// Implement database test
application.get("/database-test", (request, response) => {
    connection.query("select * from messages", 
        (error, results, fields) => {
            if (error) {
                response.send(error.stack);
                console.error("Database error: ", error.stack);
                return;
            }

            response.render("database-test", {results: results});
    });
});

// Handle adding posts
application.post("/make-post", (request, response) => {
    let data = {poster: request.body.poster, 
                text: request.body.text};

    // Handle missing data
    if (!data.poster) {
        response.render("error", {error: "Must specify poster name.", 
                                  back_link: "/database-test"});
        return;
    }
    if (!data.text) {
        response.render("error", {error: "Must specify post text.", 
                                  back_link: "/database-test"});
        return;
    }

    // Insert into database
    connection.query("insert into messages set ?", data, 
                     (error, results, fields) => {
                         if (error) {
                             response.send(error.stack);
                             console.error("Database error: ", 
                                           error.stack);
                             return;
                         }

                         // If successful, show it
                         response.redirect("/database-test");
                     });
});

// Open the port
application.listen(3000, () => {
    console.log("Application listening on port 3000!");
});

