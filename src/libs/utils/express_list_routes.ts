//THIS IS A MODIFIED VERSION OF https://github.com/labithiotis/express-list-routes
//ALL CREDIT GOES TO @labithiotis

//@ts-nocheck
const path = require('path');

const defaultOptions = {
    prefix: '',
    spacer: 7,
    logger: console.info,
    api_base: '',
};

const COLORS = {
    yellow: 33,
    green: 32,
    blue: 34,
    red: 31,
    grey: 90,
    magenta: 35,
    clear: 39,
};


const colorText = (color, string) => `\u001b[${color}m${string}\u001b[${COLORS.clear}m`;

function colorMethod(method) {
    switch (method) {
        case 'POST':
            return colorText(COLORS.yellow, method);
        case 'GET':
            return colorText(COLORS.green, method);
        case 'PUT':
            return colorText(COLORS.blue, method);
        case 'DELETE':
            return colorText(COLORS.red, method);
        case 'PATCH':
            return colorText(COLORS.grey, method);
        default:
            return method;
    }
}

function getPathFromRegex(regexp) {
    return regexp.toString().replace('/^', '').replace('?(?=\\/|$)/i', '').replace(/\\\//g, '/');
}

function combineStacks(acc, stack) {
    if (stack.handle.stack) {
        const routerPath = getPathFromRegex(stack.regexp);
        return [...acc, ...stack.handle.stack.map((stack) => ({routerPath, ...stack}))];
    }
    return [...acc, stack];
}

function getStacks(app) {
    // Express 3
    if (app.routes) {
        // convert to express 4
        return Object.keys(app.routes)
            .reduce((acc, method) => [...acc, ...app.routes[method]], [])
            .map((route) => ({route: {stack: [route]}}));
    }

    // Express 4
    if (app._router && app._router.stack) {
        return app._router.stack.reduce(combineStacks, []);
    }

    // Express 4 Router
    if (app.stack) {
        return app.stack.reduce(combineStacks, []);
    }

    // Express 5
    if (app.router && app.router.stack) {
        return app.router.stack.reduce(combineStacks, []);
    }

    return [];
}


function generateRouteStructure(app, options) {
    const stacks = getStacks(app);
    const routes = {};
    if (stacks) {
        for (const stack of stacks) {
            if (stack.route) {
                const routeLogged = {};
                for (const route of stack.route.stack) {
                    const method = route.method ? route.method.toUpperCase() : null;
                    if (!routeLogged[method] && method) {
                        const stackMethod = method;
                        const stackPath = path.resolve(
                            [options.prefix, stack.routerPath, stack.route.path, route.path].filter((s) => !!s).join(''),
                        );
                        // remove any disk letter from the path (C:\, D:\, etc)
                        const stackPathWithoutDiskLetter = stackPath.replace(/^[a-zA-Z]:/, '')
                            .replace(/\\/g, '/')

                        const entity = stackPathWithoutDiskLetter.split('/')[1];
                        if (!routes[entity]) {
                            routes[entity] = {};
                        }
                        if (!routes[entity][method]) {
                            routes[entity][method] = [];
                        }
                        routes[entity][method].push(stackPathWithoutDiskLetter);
                        routeLogged[method] = true;
                    }
                }
            }
        }
    }
    return routes;
}

function basicRender(routes) {
    return Object.keys(routes).map((entity) => {
        return `<li class="entity">${entity}
                            <ul>
                                ${Object.keys(routes[entity]).map((method) => {
            return `<li class="method">${method}
                            <ul>
                                            ${routes[entity][method].map((path) => {
                return `<li class="route"><a href="${path}">${path}</a></li>`;
            }).join('')}
                                        </ul>
                                    </li>`;
        }).join('')}
                            </ul>
                        </li>`;
    })
}

export function serveRouteList(app, opts) {
    const options = {...defaultOptions, ...opts};

    app.get('/', (req, res) => {
        let routes = generateRouteStructure(app, options);
        res.send(`
            <html lang="en">
                <head>
                    <title>Routes /w JSONCRACK</title>
                    <style>
                        body {
                            font-family: monospace;
                            font-size: 14px;
                            line-height: 1.5;
                            background: #f5f5f5;
                            color: #333;
                            padding: 2em;
                            
                        
                        }
                        
                        ul {
                            list-style: none;
                            
                        }
                        
                        .entity {
                            font-weight: bold;
                            margin-bottom: 1em;
                            
                        }
                        
                        .method {
                            font-weight: bold;
                            margin-bottom: 1em;
                            
                        }
                        
                        
                        .route {
                            margin-bottom: 0.5em;
                            
                        }
                        
                        a {
                        
                            text-decoration: none;
                            
                        }
                        
                        a:hover {
                            text-decoration: underline;
                            
                        }
                        
                         .entity ul {
                            margin-left: 1em;
                            
                         }
                         
                            .method ul {
                            margin-left: 1em;
                            
                            }
                            
                            .route ul {
                            margin-left: 1em;
                            }
                            
                            
                     
                        </style>
                </head>
                <body>
                    <ul>
                        ${basicRender(routes)}
                    </ul>
                </body>
            </html>
        `);
    });

    console.info(`Routes available at ${options.api_base}/{entity}`);

    return;


}
