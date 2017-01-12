#!/usr/bin/env node

// requires
var fs = require('fs');
var vm = require('vm');
var d3 = require('d3');
var jsdom = require('jsdom');
var exec = require('child_process').exec;

args = {
	print_help: function(process) {
		console.log('netpdf.js: prints a JSON network in a PDF file.');
		console.log('usage: netpdf.js [options]');
		console.log('  --help                help menu.');
		console.log('  --input               input JSON file, required.');
		console.log('  --output              output PDF file, required.');
		console.log('  --node-radius         node radius [5].');
		console.log('  --node-color          primary node color [\'#000\'].');
		console.log('  --node-color-2        secondary node color for isolated nodes [#ddd].');
		console.log('  --node-stroke         node stroke color in hex code [#fff].');
		console.log('  --node-stroke-width   node stroke width [1].');
		console.log('  --edge-width          edge with [1].');
		console.log('  --edge-color          edge color in hex code [#f00].');
		console.log('  --edge-opacity        edge opacity [0.1].');
		process.exit();
	},

	get_params: function(process) {
		var params = {
			'input': null,
			'output': null,
			'nodeRadius': 2,
			'nodeColor': '#000',
			'nodeColor2': '#ddd',
			'nodeStroke': '#fff',
			'nodeStrokeWidth': 0.6,
			'edgeWidth': 1,
			'edgeColor': '#aaa',
			'edgeOpacity': 0.1
		};
		var argv = process.argv;
		var thisModule = this;
		if (argv.length == 2) {
			thisModule.print_help(process);
		}
		argv.forEach(function (val, index) {
			// help
			if (val == '--help') {
				thisModule.print_help(process);
			}
			// input
			if (val == '--input') {
				params['input'] = argv[index+1];
			}
			// output
			if (val == '--output') {
				params['output'] = argv[index+1];
			}
			// node radius
			if (val == '--node-radius') {
				params['nodeRadius'] = argv[index+1];
			}
			// node color
			if (val == '--node-color') {
				params['nodeColor'] = argv[index+1];
			}
			// node color 2
			if (val == '--node-color-2') {
				params['nodeColor2'] = argv[index+1];
			}
			// node stroke
			if (val == '--node-stroke-width') {
				params['nodeStrokeWidth'] = argv[index+1];
			}
			// node stroke color
			if (val == '--node-stroke') {
				params['nodeStroke'] = argv[index+1];
			}
			// edge width
			if (val == '--edge-width') {
				params['edgeWidth'] = argv[index+1];
			}
			// edge color
			if (val == '--edge-color') {
				params['edgeColor'] = argv[index+1];
			}
			// edge opacity
			if (val == '--edge-opacity') {
				params['edgeOpacity'] = argv[index+1];
			}
		});

		// check input and output
		if (params.input === null) {
			console.log('error: no input was given');
			process.exit();
		}
		if (params.output === null) {
			console.log('error: no output was given');
			process.exit();
		}
		return params;
	}
};

// read arguments
params = args.get_params(process);

// read network
console.log('reading network');
var network = JSON.parse(fs.readFileSync(params.input, 'utf8'));
var nodes = network['nodes'];
var edges = network['links'];

// get degrees
var ids = {}
for (var i=0; i<nodes.length; i++ ) {
	ids[nodes[i].label] = i;
	nodes[i].degree = 0;
}
for (var i=0; i<edges.length; i++) {
	nodes[ids[edges[i].source]].degree++;
	nodes[ids[edges[i].target]].degree++;
}

// get dimensions, rescale network
console.log('rescale coordinates');
var frame = 2*params.nodeRadius;
var min_x = nodes[0].x;
var max_x = nodes[0].x;
var min_y = nodes[0].y;
var max_y = nodes[0].y;
	for (var i=1; i<nodes.length; i++) {
	min_x = Math.min(min_x, nodes[i].x);
	max_x = Math.max(max_x, nodes[i].x);
	min_y = Math.min(min_y, nodes[i].y);
	max_y = Math.max(max_y, nodes[i].y);
}
var width = max_x - min_x;
var height = max_y - min_y;
var new_scale_x = d3.scale.linear().domain([min_x, max_x]).range([0, width]);
var new_scale_y = d3.scale.linear().domain([min_y, max_y]).range([0, height]);
for (var i=0; i<nodes.length; i++) {
  	nodes[i].x = new_scale_x(nodes[i].x) + frame;
  	nodes[i].y = new_scale_y(nodes[i].y) + frame;
}
for (var i=0; i<edges.length; i++) {
	for (var j=0; j<edges[i]['coords'].length; j++) {
		edges[i]['coords'][j].x = new_scale_x(edges[i]['coords'][j].x) + frame;
		edges[i]['coords'][j].y = new_scale_y(edges[i]['coords'][j].y) + frame;
	}
}

// create html dom
htmlStub = '<html><head></head><body></body></html>'
jsdom.env({features: {QuerySelector: true},
	html: htmlStub,
	done : function(errors, window) {
		// get body
		body = window.document.querySelector('body');

		// append d3 svg
		console.log('draw network');
		var svg = d3.select(body).append("svg")
			.attr('xmlns', 'http://www.w3.org/2000/svg')
			.attr("width", width + 2*frame)
			.attr("height", height + 2*frame)

		// draw edges
		var d3line = d3.svg.line()
						.x(function(d){return d.x;})
						.y(function(d){return d.y;})
						.interpolate("linear");
		for (var i=0; i<edges.length; i++) {
			svg.append("path").attr("d", d3line(edges[i]['coords']))
				.style("stroke-width", params.edgeWidth)
				.style("stroke", params.edgeColor)
				.style("fill", "none")
				.style('stroke-opacity', params.edgeOpacity);
		}

		// draw nodes
		svg.selectAll('.node')
			.data(d3.entries(nodes))
			.enter()
			.append('circle')
			.classed('node', true)
			.attr({'r': params.nodeRadius,
				'fill': function(d){ return d.value.degree > 0 ? params.nodeColor : params.nodeColor2;},
				'stroke-width': params.nodeStrokeWidth,
				'stroke': params.nodeStroke})
			.attr('cx', function(d){ return d.value.x;})
			.attr('cy', function(d){ return d.value.y;});

		// write file
		console.log('write output');
		var tmpSvgFile = params.input.substr(0, params.input.lastIndexOf(".")) + "-tmp.svg";
		fs.writeFile(tmpSvgFile, d3.select(body).html(), function(writeError) {
			if(writeError) return console.log(writeError);
			console.log('svg file is written');

			exec('rsvg-convert -f pdf -o ' + params.output + ' ' + tmpSvgFile, function(rsvgError) {
				// If rsvg throws an error, try inkscape
				if(rsvgError) {
					console.log(rsvgError);
					console.log('RSVG could not convert it, trying with Inkscape');
					exec('inkscape --without-gui --export-pdf="' + params.output + '" ' + tmpSvgFile, function(inkscapeError) {
						if(inkscapeError) {
							console.log(inkscapeError);
							console.log('Sorry, could not create PDF :(');
							return;
						}
						else {
							// clean up and crop margins
							console.log('pdf file is written');
							exec('rm ' + tmpSvgFile, function(rmError) {
								if(rmError) return console.log(rmError);
							});
							exec('pdfcrop --margins 10 ' + params.output + ' ' + params.output, function(pdfcropError) {
								if(pdfcropError) return console.log(pdfcropError);
								console.log('margins set');
							});
						}
					});
				}
				else {
					// clean up and crop margins
					console.log('pdf file is written');
					exec('rm ' + tmpSvgFile, function(rmError) {
						if(rmError) return console.log(rmError);
					});
					exec('pdfcrop --margins 10 ' + params.output + ' ' + params.output, function(pdfcropError) {
						if(pdfcropError) return console.log(pdfcropError);
						console.log('margins set');
					});
				}
			});
		});	
	}
});