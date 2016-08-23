(function () {
    'use strict';

    var UNKNOWN = 'unknown',
        NOTITLE = 'notitle',
        LEVEL = ['ALL', 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'],
        COLUMNS = [
            {
                key: 'logger',
                title: 'Logger',
                filter: 'select'
            },
            {
                key: 'date',
                title: 'Date',
                filter: 'like',
                formatter: function (o) {
                    return o.date.toGMTString();
                }
            },
            {
                key: 'level',
                title: 'Level',
                filter: 'select',
                formatter: function (o) {
                    return LEVEL[o.level];
                }
            },
            {
                key: 'thread',
                title: 'Thread',
                filter: 'select'
            },
            {
                key: 'code',
                title: 'Code',
                filter: 'like',
                formatter: function (o) {
                    return (o.qualified || o.file || NUKNOWN) + ':' + o.line ;
                }
            },
            {
                key: 'message',
                title: 'Message',
                filter: 'like'
            }
        ],
        toInt = function (num) { return parseInt(num, 10); };

        /** The Log object class. */
    var LogObj = (function () {
            function LogObj (o) {
                o = o || { source: o || '' };
                this.logger = o.logger || UNKNOWN;
                this.date = o.date || new Date();
                this.level = o.level && LEVEL.indexOf(LEVEL) || 0;
                this.thread = o.thread || UNKNOWN;
                this.file = o.file || null;
                this.qualified = o.qualified || null;
                this.line = toInt(o.line) || 0;
                this.message = o.message || null;
                this.source = o.source;
            }
            return LogObj;
        })();

        /** Rule for parser to create Log object. */
    var LogRule = (function () {
            function LogRule (o) {
                o = o || {};
                this.logger = o.logger || unknown;
                this.probe = o.regexp || null;
                this.groups = o.groups || [];
            }
            LogRule.prototype.test = function (str) {
                return this.probe && this.probe.test(str) || false;
            };
            LogRule.prototype.exec = function (str) {
                return this.probe && this.probe.exec(str) || [ str ];
            };
            LogRule.prototype.toLog = function (str) {
                var args = this.exec(str),
                    groups = this.groups,
                    log = { source: str };
                for (var i = 0, len = groups.length; i < len; ++i) {
                    log[groups[i]] = args[i + 1];
                }
                return new LogObj(log);
            };
            return LogRule;
        })();

        /** Parser for log strings. */
    var LogParser = (function () {
            function LogParser (o) {
                o = o || {};
                this.rules = o.rules || [];
            }
            LogParser.prototype.parse = function (node) {
                var lines, data = [], rules = this.rules;
                if (typeof node === 'string') {
                    node = document.querySelector(node);
                }
                if (node) {
                    lines = node.innerHTML(split('\n')).map(function (item) {
                            var div = document.createElement('div');
                            div.innerHTML = item;
                            return div.textContent || div.innerText || '';
                        });
                    lines.forEach(function (line) {
                        rules.forEach(function (rule) {
                            if (rule.test(line)) {
                                data.push(rule.toLog(line));
                            }
                        });
                    });
                }
                return data;
            };
            return LogParser;
        })();

        /** Table for logview. */
    var LogTable = (function () {
            function LogTable (o) {
                o = o || {};
                this.node = {};
                this.node.src = (typeof o.node === 'string') ? document.querySelector(o.node) : o.node;
                this.node.table = document.createElement('table');
                this.node.thead = document.createElement('thead');
                this.node.tbody = document.createElement('tbody');
                if (this.node.src) {
                    this.node.src.appendChild(this.table);
                }
                this.node.table.appendChild(this.node.thead);
                this.node.table.appendChild(this.node.tbody);
                this.node.table.classList.add('log', 'analyzer');
                this.data = o.data || [];
                this.columns = o.columns || COLUMNS;
                
            }
            LogTable.prototype._renderHead = function (cols) {
                cols = cols || this.columns;
                var html = [];
                html.push('<tr>');
                cols.forEach(function (col) {
                    html.push('<th class="log ' + col.key + '">' + (col.title || NOTITLE) + '</th>');
                });
                html.push('</tr>');
                this.node.thead.innerHTML = html.join('');
            };
            LogTable.prototype._renderBody = function (data) {
                data = data || this.data;
                var html = [];
                data.forEach(function (item) {
                    if (item.message) {
                        html.push('<tr class="log ' + LEVEL[item.level].toLowerCase() + '">');
                        cols.forEach(function (col) {
                            html.push('<td class="' + col.key + '">' + (col.formatter && col.formatter(item) || item[col.key]) + '</td>');
                        });
                    } else {
                        html.push('<tr class="text">');
                        html.push('<td colspan="' + cols.length + '">' + (item.source || '&nbsp;') + '</td>');
                    }
                    html.push('</tr>');
                });
                this.node.tbody.innerHTML = html.join('');
            };
            LogTable.prototype.render = function () {
                this._renderHead(this.columns);
                this._renderBody(this.data);
            };
            return LogTable;
        })();

    window.onload = function () {

        var  parser = new LogParser({
                rules: [
                    new LogRule({
                        logger: 'All',
                        probe: /(.*)/,
                        groups: [ 'message' ]
                    })
                ]
            });
    
        var table = new LogTable({
                node: '.data pre',
                data: parser.parse('.data pre')
            });
    
        table.render();
        
        console.log('Log analyzer loaded...');
    };
})();

window.onload = function () { console.log('ext'); };
