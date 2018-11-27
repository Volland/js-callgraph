/*******************************************************************************
 * Copyright (c) 2013 Max Schaefer
 * Copyright (c) 2018 Persper Foundation
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v2.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *******************************************************************************/

/**
 * This module implements the depth-first transitive closure algorithm of
 * Ioannidis and Ramakrishnan ("Efficient Transitive Closure Algorithms", VLDB '88).
 */

if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function (require, exports) {
    var numset = require('./numset'),
        Graph = require('./graph').Graph;

    Graph.prototype.reachability = function (nodePred) {
        let enum_nodes = new Array();

        let nodes = this.getNodes();

        let n = nodes.length;

        for (let i = 0; i < n; i++) {
            enum_nodes[i] = nodes[i];
            nodes[i].reachability_id = i;
        }

        let visited = new Array(n).fill(0),
           visited2 = new Array(n).fill(0),
             popped = new Array(n).fill(0),
             globol = new Set(),
                  m = [],
                  t = [];

        for (let i = 0; i < n; i++) {
            m.push(new Set());
            t.push(new Set());
        }

        function add(a, b) {
          return a + b;
        }

        var graph = this;

        function visit1(i) {
            visited[i] = 1;

            if (!nodePred || nodePred(enum_nodes[i])) {
                let succ = graph.succ(enum_nodes[i])

                for (let j= 0; j < succ.length; j++) {
                  let index = succ[j].reachability_id;
                  if (nodePred && !nodePred(succ[j]))
                    continue;
                  if (m[i].has(index) || t[i].has(index))
                    continue;

                  if (visited[index] == 0)
                    visit1(index);

                  if (popped[index] == 1) {
                    m[i] = new Set(m[i])
                    for (let elem of m[index].entries()) {
                      m[i].add(elem[0]);
                    }
                    m[i].add(index);
                    t[i] = new Set(t[i])
                    for (let elem of t[index].entries())
                      t[i].add(elem[0]);
                    for (let elem of m[i].entries())
                      t[i].delete(elem[0]);
                  } else {
                    t[i] = new Set(t[i].add(index));
                  }
                }
              }

            if(t[i].has(i)) {
              if (t[i].size === 1) {
                m[i].add(i);
                t[i] = new Set();
                globol = new Set(m[i]);
                visit2(i);
              } else {
                t[i].delete(i);
                m[i].add(i);
              }
            }

            popped[i] = 1;
        }

        function visit2(i) {
            visited2[i] = 1;

            if (!nodePred || nodePred(enum_nodes[i])) {
              let succ = graph.succ(enum_nodes[i])

              for (let j= 0; j < succ.length; j++) {
                let index = succ[j].reachability_id;
                if (nodePred && !nodePred(succ[j]))
                  return;
                if (visited2[index] == 0 && t[index].size !== 0)
                  visit2(index);
              }
            }

            m[i] = new Set(globol);
            t[i] = new Set();
        }
        return {
            getReachable: function (src) {
                var src_id = src.reachability_id;
                if (src_id === undefined) {
                  enum_nodes.push(src);
                  visited.push(0);
                  visited2.push(0);
                  popped.push(0);
                  m.push(new Set());
                  t.push(new Set());
                  src.reachability_id = enum_nodes.length - 1;
                  src_id = src.reachability_id;
                }

                if (visited[src_id] == 0)
                    visit1(src_id);

                var tc = new Set(m[src_id]);
                for (let elem of t[src_id].entries())
                  tc.add(elem);

                let ret = new Array();
                for (let elem of tc.entries()) {
                  ret.push(enum_nodes[elem[0]]);
                }

                return ret;
            },
            iterReachable: function (src, cb) {
              var src_id = src.reachability_id;
              if (src_id === undefined) {
                enum_nodes.push(src);
                visited.push(0);
                visited2.push(0);
                popped.push(0);
                m.push(new Set());
                t.push(new Set());
                src.reachability_id = enum_nodes.length - 1;
                src_id = src.reachability_id;
              }
              if (visited[src_id] == 0)
                  visit1(src_id);

              var tc = new Set(m[src_id]);
              for (let elem of t[src_id].entries())
                tc.add(elem);

              for (let elem of tc.entries())
                  cb(enum_nodes[elem[0]]);
            },
            reaches: function (src, dest) {
                var src_id = src.reachability_id,
                   dest_id = dest.reachability_id;

                if (visited[src_id] == 0)
                    visit1(src_id);

                var tc = new Set(m[src_id]);
                for (let elem of t[src_id].entries())
                  tc.add(elem);

                return tc.has(des_id);
            }
        };
    };
});
