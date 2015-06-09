=========
netpdf.js
=========
-------------------------------------
prints a JSON network into a PDF file
-------------------------------------

:Author: Enys Mones
:Version: 0.1
:License: MIT


Requirements
------------

- `node.js`<https://nodejs.org>`_ to run javascript in the terminal.
- node.js packages: vm, d3, fs, jsdom, sys.
- `librsvg<https://github.com/GNOME/librsvg>`_ to convert svg to pdf.
- `pdfcrop<https://www.ctan.org/pkg/pdfcrop>`_ to remove margins.


Install
-------

Just install node.js and the other packages.


Input
-----

The network in JSON format (see airlines.json in the test folder).


Output
------

A PDF of the network.


Credits to
----------

http://www.pyktech.com/blog/150/
http://mango-is.com/blog/engineering/pre-render-d3-js-charts-at-server-side.html
