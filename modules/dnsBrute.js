/*
    Copyright Sergio García <s3rgio.gr gmail com>

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


// Private stuff

var subquest = require('subquest'),

    HELP = {
        description : 'DNS brute force',
        options     : {
            host : {
                description  : 'Domain to explore',
                defaultValue : 'google.com',
                type         : 'allValid'
            },
            dnsServer : {
                description  : 'Specify your custom DNS resolver',
                defaultValue : '87.216.170.85',
                type         : 'allValid'
            },
            rateLimit : {
                description  : "Set the Rate Limit [Default value is 10]",
                defaultValue : 10,
                type         : 'positiveInt'
            },
            dictionary : {
                description  : 'Set the dictionary for bruteforcing [top_50, ...]',
                defaultValue : 'top_100',
                type         : 'allValid'
            }
        }
    };

// Public stuff

module.exports.help = HELP;

module.exports.run = function (options, callback) {
    subquest.getSubDomains(options).on('end', function (arr) {
    callback(null, arr); // array of subdomains.
});
};
