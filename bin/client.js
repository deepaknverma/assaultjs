#!/usr/bin/env node

/*
    Copyright Jesus Perez <jesusprubio gmail com>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

var async = require('async'),
    readline = require('readline'),
    shell = require('shelljs'),
    lodash = require('lodash'),

    Assault = require('../'),
    printer = require('../utils/printer'),

    modulesInfo = {},
    modulesList = [],
    exitNext = false,
    assault;


function completer(line) {
    var completions = modulesList.join(' '),
        hits;

    hits = modulesList.filter(function (c) {
        return c.indexOf(line) === 0;
    });

    return [(hits.length + 1 ? hits : completions), line];
}

function runModule(moduleName, rl) {
    var moduleInfo = modulesInfo[moduleName].help,
        moduleOptions = {};

    function cb(err, result) {
        printer.bold('\nRESULT:\n');
        if (!err) {
            if (!result || result.length === 0) {
                printer.highlight('No result');
            } else {
                printer.json(result);
            }
        } else {
            printer.error('ERROR: run(): ' + JSON.stringify(err));
        }
        printer.regular('\n');
        rl.prompt();
    }

    // Asking for the parameters (if any)
    if (moduleInfo.options) {
        async.eachSeries(
            Object.keys(moduleInfo.options),
            function (option, callback) {
                var defaultValue = moduleInfo.options[option].defaultValue,
                    printDefault = 'required';

                if (defaultValue) {
                    printDefault = defaultValue;
                }
                rl.question(
                    '* ' + option +
                    ': ' + moduleInfo.options[option].description +
                    ' (' + printDefault + '): ',
                    function (answer) {
                        if (answer) {
                            answer = answer.trim();
                        }
                        // The parser will stop if:
                        // - the type doesn't exist
                        // - param not passed & not defaultValue (required)
                        moduleOptions[option] = answer;
                        callback();
                    }
                );
            },
            function (err) {
                if (!err) {
                    printer.infoHigh('\nStarting ...\n');
                    assault.runModule(moduleName, moduleOptions, cb);
                }
            }
        );
    } else {
        printer.infoHigh('\nStarting ...\n');
        assault.runModule(moduleName, moduleOptions, cb);
    }
}

function exitFine() {
    printer.bold('\nSee you! ;)');
    process.exit();
}

function runCommand(comm, rl) {
    var splitComm = comm.split(' '),
        commCases = {
            // Just in case a enter push
            '': function () {
                rl.prompt();
            },
            'quit': function () {
                exitFine();
            },
            'exit': function () {
                exitFine();
            },
            'help': function () {
                if (splitComm.length > 1 && modulesList.indexOf(splitComm[1]) !== -1) {
                    if (splitComm[1] === 'help') {
                        printer.error('Really? xD');
                    } else {
                        printer.json(modulesInfo[splitComm[1]].help);
                    }
                } else {
                    printer.error('ERROR: Module not found');
                }
                rl.prompt();
            },
            'setShodanKey': function () {
                rl.question(
                    '* Enter your key: ',
                    function (answer) {
                        if (answer) {
                            answer = answer.trim();
                            assault.setShodanKey(answer);
                            printer.infoHigh('Using SHODAN key: ');
                            printer.highlight(answer + '\n');
                        }
                        rl.prompt();
                    }
                );
            }
        };

    if (commCases[splitComm[0]]) {
        commCases[splitComm[0]]();
    } else {
        if (modulesList.indexOf(comm) !== -1) {
            runModule(comm, rl);
        } else {
            shell.exec(comm, { silent : true }, function (code, output) {
                if (code === 127) {
                    printer.error('ERROR: module/command not found');
                } else {
                    printer.regular(output);
                }
                rl.prompt();
            });
        }
    }
}

function createPrompt() {
    var rl = readline.createInterface(process.stdin, process.stdout, completer);

    rl.setPrompt('Assaultjs> ');
    rl.prompt();

    // On new line
    rl.on('line', function (line) {
        runCommand(line.trim(), rl);
    });

    // On Ctrl+C, Ctrl+D, etc.
    rl.on('close', function () {
        if (!exitNext) {
            printer.bold('\nPress Ctrl+C again to quit.');
            exitNext = true;
            createPrompt();
            // If more than 5 secs. the user will need
            // to push the keys combination twice again
            setTimeout(
                function () {
                    exitNext = false;
                },
                5000
            );
        } else {
            exitFine();
        }
    });
}


// Creating the AssaultJS object
assault = new Assault({});

modulesInfo = assault.getModulesInfo();

// Generating modules list
lodash.each(modulesInfo, function (v, k) {
    modulesList.push(k);
});
// and manually adding client modules
modulesList = modulesList.concat(['help', 'quit', 'exit', 'setShodanKey']);

// Welcome info is printed
printer.bold('\n\tWelcome to AssaultJS\n');
printer.info('Use the Tab key to see available commands and type "help [command]" get more info');
printer.info('If you have doubts just run it and use the default options :)\n');

// The prompt is started
createPrompt();

// Just in case ;)
//process.on('uncaughtException', function (err) {
//    printer.error('"uncaughtException" found:');
//    printer.error(err);
//});
