(function ($) {
    var settings = {},
        roots = {},
        caches = {},
        _consts = {
            className: {
                BUTTON: "zbutton",
                LEVEL: "level",
                ICO_LOADING: "ico_loading",
                SWITCH: "switch"
            },
            event: {
                NODECREATED: "ztree_nodeCreated",
                CLICK: "ztree_click",
                EXPAND: "ztree_expand",
                COLLAPSE: "ztree_collapse",
                ASYNC_SUCCESS: "ztree_async_success",
                ASYNC_ERROR: "ztree_async_error"
            },
            id: {
                A: "_a",
                ICON: "_ico",
                SPAN: "_span",
                SWITCH: "_switch",
                UL: "_ul"
            },
            line: {
                ROOT: "root",
                ROOTS: "roots",
                CENTER: "center",
                BOTTOM: "bottom",
                NOLINE: "noline",
                LINE: "line"
            },
            folder: {
                OPEN: "open",
                CLOSE: "close",
                DOCU: "docu"
            },
            node: {
                CURSELECTED: "curSelectedNode"
            }
        },
        _setting = {
            treeId: "",
            treeObj: null,
            view: {
                addDiyDom: null,
                autoCancelSelected: true,
                dblClickExpand: true,
                expandSpeed: "fast",
                fontCss: {},
                nameIsHTML: false,
                selectedMulti: true,
                showIcon: true,
                showLine: true,
                showTitle: true
            },
            data: {
                key: {
                    children: "children",
                    name: "name",
                    title: "title",
                    url: "url"
                },
                simpleData: {
                    enable: true,
                    idKey: "id",
                    pIdKey: "parentId",
                    rootPId: null
                },
                keep: {
                    parent: false,
                    leaf: false
                }
            },
            async: {
                enable: false,
                contentType: "application/x-www-form-urlencoded",
                type: "post",
                dataType: "text",
                dataName: null,
                url: "",
                autoParam: [],
                otherParam: [],
                dataFilter: null
            },
            callback: {
                beforeAsync: null,
                beforeClick: null,
                beforeDblClick: null,
                beforeRightClick: null,
                beforeMouseDown: null,
                beforeMouseUp: null,
                beforeExpand: null,
                beforeCollapse: null,
                beforeRemove: null,
                onAsyncError: null,
                onAsyncSuccess: null,
                onNodeCreated: null,
                onClick: null,
                onDblClick: null,
                onRightClick: null,
                onMouseDown: null,
                onMouseUp: null,
                onExpand: null,
                onCollapse: null,
                onRemove: null
            }
        },
        _initRoot = function (setting) {
            var r = data.getRoot(setting);
            if (!r) {
                r = {};
                data.setRoot(setting, r)
            }
            r[setting.data.key.children] = [];
            r.expandTriggerFlag = false;
            r.curSelectedList = [];
            r.noSelection = true;
            r.createdNodes = [];
            r.zId = 0;
            r._ver = (new Date()).getTime()
        },
        _initCache = function (setting) {
            var c = data.getCache(setting);
            if (!c) {
                c = {};
                data.setCache(setting, c)
            }
            c.nodes = [];
            c.doms = []
        },
        _bindEvent = function (setting) {
            var o = setting.treeObj,
                c = consts.event;
            o.bind(c.NODECREATED, function (event, treeId, node) {
                tools.apply(setting.callback.onNodeCreated, [event, treeId, node])
            });
            o.bind(c.CLICK, function (event, srcEvent, treeId, node, clickFlag) {
                tools.apply(setting.callback.onClick, [srcEvent, treeId, node, clickFlag])
            });
            o.bind(c.EXPAND, function (event, treeId, node) {
                tools.apply(setting.callback.onExpand, [event, treeId, node])
            });
            o.bind(c.COLLAPSE, function (event, treeId, node) {
                tools.apply(setting.callback.onCollapse, [event, treeId, node])
            });
            o.bind(c.ASYNC_SUCCESS, function (event, treeId, node, msg) {
                tools.apply(setting.callback.onAsyncSuccess, [event, treeId, node, msg])
            });
            o.bind(c.ASYNC_ERROR, function (event, treeId, node, XMLHttpRequest, textStatus, errorThrown) {
                tools.apply(setting.callback.onAsyncError, [event, treeId, node, XMLHttpRequest, textStatus, errorThrown])
            })
        },
        _unbindEvent = function (setting) {
            var o = setting.treeObj,
                c = consts.event;
            o.unbind(c.NODECREATED).unbind(c.CLICK).unbind(c.EXPAND).unbind(c.COLLAPSE).unbind(c.ASYNC_SUCCESS).unbind(c.ASYNC_ERROR)
        },
        _eventProxy = function (event) {
            var target = event.target,
                setting = data.getSetting(event.data.treeId),
                tId = "",
                node = null,
                nodeEventType = "",
                treeEventType = "",
                nodeEventCallback = null,
                treeEventCallback = null,
                tmp = null;
            if (tools.eqs(event.type, "mousedown")) {
                treeEventType = "mousedown"
            } else {
                if (tools.eqs(event.type, "mouseup")) {
                    treeEventType = "mouseup"
                } else {
                    if (tools.eqs(event.type, "contextmenu")) {
                        treeEventType = "contextmenu"
                    } else {
                        if (tools.eqs(event.type, "click")) {
                            if (tools.eqs(target.tagName, "span") && target.getAttribute("treeNode" + consts.id.SWITCH) !== null) {
                                tId = tools.getNodeMainDom(target).id;
                                nodeEventType = "switchNode"
                            } else {
                                tmp = tools.getMDom(setting, target, [{
                                    tagName: "a",
                                    attrName: "treeNode" + consts.id.A
                                }]);
                                if (tmp) {
                                    tId = tools.getNodeMainDom(tmp).id;
                                    nodeEventType = "clickNode"
                                }
                            }
                        } else {
                            if (tools.eqs(event.type, "dblclick")) {
                                treeEventType = "dblclick";
                                tmp = tools.getMDom(setting, target, [{
                                    tagName: "a",
                                    attrName: "treeNode" + consts.id.A
                                }]);
                                if (tmp) {
                                    tId = tools.getNodeMainDom(tmp).id;
                                    nodeEventType = "switchNode"
                                }
                            }
                        }
                    }
                }
            } if (treeEventType.length > 0 && tId.length == 0) {
                tmp = tools.getMDom(setting, target, [{
                    tagName: "a",
                    attrName: "treeNode" + consts.id.A
                }]);
                if (tmp) {
                    tId = tools.getNodeMainDom(tmp).id
                }
            }
            if (tId.length > 0) {
                node = data.getNodeCache(setting, tId);
                switch (nodeEventType) {
                    case "switchNode":
                        if (!node.isParent) {
                            nodeEventType = ""
                        } else {
                            if (tools.eqs(event.type, "click") || (tools.eqs(event.type, "dblclick") && tools.apply(setting.view.dblClickExpand, [setting.treeId, node], setting.view.dblClickExpand))) {
                                nodeEventCallback = handler.onSwitchNode
                            } else {
                                nodeEventType = ""
                            }
                        }
                        break;
                    case "clickNode":
                        nodeEventCallback = handler.onClickNode;
                        break
                }
            }
            switch (treeEventType) {
                case "mousedown":
                    treeEventCallback = handler.onZTreeMousedown;
                    break;
                case "mouseup":
                    treeEventCallback = handler.onZTreeMouseup;
                    break;
                case "dblclick":
                    treeEventCallback = handler.onZTreeDblclick;
                    break;
                case "contextmenu":
                    treeEventCallback = handler.onZTreeContextmenu;
                    break
            }
            var proxyResult = {
                stop: false,
                node: node,
                nodeEventType: nodeEventType,
                nodeEventCallback: nodeEventCallback,
                treeEventType: treeEventType,
                treeEventCallback: treeEventCallback
            };
            return proxyResult
        },
        _initNode = function (setting, level, n, parentNode, isFirstNode, isLastNode, openFlag) {
            if (!n) {
                return
            }
            var r = data.getRoot(setting),
                childKey = setting.data.key.children;
            n.level = level;
            n.tId = setting.treeId + "_" + (++r.zId);
            n.parentTId = parentNode ? parentNode.tId : null;
            if (n[childKey] && n[childKey].length > 0) {
                if (typeof n.open == "string") {
                    n.open = tools.eqs(n.open, "true")
                }
                n.open = !!n.open;
                n.isParent = true;
                n.zAsync = true
            } else {
                n.open = false;
                if (typeof n.isParent == "string") {
                    n.isParent = tools.eqs(n.isParent, "true")
                }
                n.isParent = !!n.isParent;
                n.zAsync = !n.isParent
            }
            n.isFirstNode = isFirstNode;
            n.isLastNode = isLastNode;
            n.getParentNode = function () {
                return data.getNodeCache(setting, n.parentTId)
            };
            n.getPreNode = function () {
                return data.getPreNode(setting, n)
            };
            n.getNextNode = function () {
                return data.getNextNode(setting, n)
            };
            n.isAjaxing = false;
            data.fixPIdKeyValue(setting, n)
        },
        _init = {
            bind: [_bindEvent],
            unbind: [_unbindEvent],
            caches: [_initCache],
            nodes: [_initNode],
            proxys: [_eventProxy],
            roots: [_initRoot],
            beforeA: [],
            afterA: [],
            innerBeforeA: [],
            innerAfterA: [],
            zTreeTools: []
        },
        data = {
            addNodeCache: function (setting, node) {
                data.getCache(setting).nodes[data.getNodeCacheId(node.tId)] = node
            }, getNodeCacheId: function (tId) {
                return tId.substring(tId.lastIndexOf("_") + 1)
            }, addAfterA: function (afterA) {
                _init.afterA.push(afterA)
            }, addBeforeA: function (beforeA) {
                _init.beforeA.push(beforeA)
            }, addInnerAfterA: function (innerAfterA) {
                _init.innerAfterA.push(innerAfterA)
            }, addInnerBeforeA: function (innerBeforeA) {
                _init.innerBeforeA.push(innerBeforeA)
            }, addInitBind: function (bindEvent) {
                _init.bind.push(bindEvent)
            }, addInitUnBind: function (unbindEvent) {
                _init.unbind.push(unbindEvent)
            }, addInitCache: function (initCache) {
                _init.caches.push(initCache)
            }, addInitNode: function (initNode) {
                _init.nodes.push(initNode)
            }, addInitProxy: function (initProxy, isFirst) {
                if (!!isFirst) {
                    _init.proxys.splice(0, 0, initProxy)
                } else {
                    _init.proxys.push(initProxy)
                }
            }, addInitRoot: function (initRoot) {
                _init.roots.push(initRoot)
            }, addNodesData: function (setting, parentNode, nodes) {
                var childKey = setting.data.key.children;
                if (!parentNode[childKey]) {
                    parentNode[childKey] = []
                }
                if (parentNode[childKey].length > 0) {
                    parentNode[childKey][parentNode[childKey].length - 1].isLastNode = false;
                    view.setNodeLineIcos(setting, parentNode[childKey][parentNode[childKey].length - 1])
                }
                parentNode.isParent = true;
                parentNode[childKey] = parentNode[childKey].concat(nodes)
            }, addSelectedNode: function (setting, node) {
                var root = data.getRoot(setting);
                if (!data.isSelectedNode(setting, node)) {
                    root.curSelectedList.push(node)
                }
            }, addCreatedNode: function (setting, node) {
                if (!!setting.callback.onNodeCreated || !!setting.view.addDiyDom) {
                    var root = data.getRoot(setting);
                    root.createdNodes.push(node)
                }
            }, addZTreeTools: function (zTreeTools) {
                _init.zTreeTools.push(zTreeTools)
            }, exSetting: function (s) {
                $.extend(true, _setting, s)
            }, fixPIdKeyValue: function (setting, node) {
                if (setting.data.simpleData.enable) {
                    node[setting.data.simpleData.pIdKey] = node.parentTId ? node.getParentNode()[setting.data.simpleData.idKey] : setting.data.simpleData.rootPId
                }
            }, getAfterA: function (setting, node, array) {
                for (var i = 0, j = _init.afterA.length; i < j; i++) {
                    _init.afterA[i].apply(this, arguments)
                }
            }, getBeforeA: function (setting, node, array) {
                for (var i = 0, j = _init.beforeA.length; i < j; i++) {
                    _init.beforeA[i].apply(this, arguments)
                }
            }, getInnerAfterA: function (setting, node, array) {
                for (var i = 0, j = _init.innerAfterA.length; i < j; i++) {
                    _init.innerAfterA[i].apply(this, arguments)
                }
            }, getInnerBeforeA: function (setting, node, array) {
                for (var i = 0, j = _init.innerBeforeA.length; i < j; i++) {
                    _init.innerBeforeA[i].apply(this, arguments)
                }
            }, getCache: function (setting) {
                return caches[setting.treeId]
            }, getNextNode: function (setting, node) {
                if (!node) {
                    return null
                }
                var childKey = setting.data.key.children,
                    p = node.parentTId ? node.getParentNode() : data.getRoot(setting);
                for (var i = 0, l = p[childKey].length - 1; i <= l; i++) {
                    if (p[childKey][i] === node) {
                        return (i == l ? null : p[childKey][i + 1])
                    }
                }
                return null
            }, getNodeByParam: function (setting, nodes, key, value) {
                if (!nodes || !key) {
                    return null
                }
                var childKey = setting.data.key.children;
                for (var i = 0, l = nodes.length; i < l; i++) {
                    if (nodes[i][key] == value) {
                        return nodes[i]
                    }
                    var tmp = data.getNodeByParam(setting, nodes[i][childKey], key, value);
                    if (tmp) {
                        return tmp
                    }
                }
                return null
            }, getNodeCache: function (setting, tId) {
                if (!tId) {
                    return null
                }
                var n = caches[setting.treeId].nodes[data.getNodeCacheId(tId)];
                return n ? n : null
            }, getNodeName: function (setting, node) {
                var nameKey = setting.data.key.name;
                return "" + node[nameKey]
            }, getNodeTitle: function (setting, node) {
                var t = setting.data.key.title === "" ? setting.data.key.name : setting.data.key.title;
                var str;
                if (node[t] != null) {
                    str = node[t]
                } else {
                    str = node[setting.data.key.name]
                }
                return "" + str
            }, getNodes: function (setting) {
                return data.getRoot(setting)[setting.data.key.children]
            }, getNodesByParam: function (setting, nodes, key, value) {
                if (!nodes || !key) {
                    return []
                }
                var childKey = setting.data.key.children,
                    result = [];
                for (var i = 0, l = nodes.length; i < l; i++) {
                    if (nodes[i][key] == value) {
                        result.push(nodes[i])
                    }
                    result = result.concat(data.getNodesByParam(setting, nodes[i][childKey], key, value))
                }
                return result
            }, getNodesByParamFuzzy: function (setting, nodes, key, value) {
                if (!nodes || !key) {
                    return []
                }
                var childKey = setting.data.key.children,
                    result = [];
                value = value.toLowerCase();
                for (var i = 0, l = nodes.length; i < l; i++) {
                    if (typeof nodes[i][key] == "string" && nodes[i][key].toLowerCase().indexOf(value) > -1) {
                        result.push(nodes[i])
                    }
                    result = result.concat(data.getNodesByParamFuzzy(setting, nodes[i][childKey], key, value))
                }
                return result
            }, getNodesByFilter: function (setting, nodes, filter, isSingle, invokeParam) {
                if (!nodes) {
                    return (isSingle ? null : [])
                }
                var childKey = setting.data.key.children,
                    result = isSingle ? null : [];
                for (var i = 0, l = nodes.length; i < l; i++) {
                    if (tools.apply(filter, [nodes[i], invokeParam], false)) {
                        if (isSingle) {
                            return nodes[i]
                        }
                        result.push(nodes[i])
                    }
                    var tmpResult = data.getNodesByFilter(setting, nodes[i][childKey], filter, isSingle, invokeParam);
                    if (isSingle && !!tmpResult) {
                        return tmpResult
                    }
                    result = isSingle ? tmpResult : result.concat(tmpResult)
                }
                return result
            }, getPreNode: function (setting, node) {
                if (!node) {
                    return null
                }
                var childKey = setting.data.key.children,
                    p = node.parentTId ? node.getParentNode() : data.getRoot(setting);
                for (var i = 0, l = p[childKey].length; i < l; i++) {
                    if (p[childKey][i] === node) {
                        return (i == 0 ? null : p[childKey][i - 1])
                    }
                }
                return null
            }, getRoot: function (setting) {
                return setting ? roots[setting.treeId] : null
            }, getRoots: function () {
                return roots
            }, getSetting: function (treeId) {
                return settings[treeId]
            }, getSettings: function () {
                return settings
            }, getZTreeTools: function (treeId) {
                var r = this.getRoot(this.getSetting(treeId));
                return r ? r.treeTools : null
            }, initCache: function (setting) {
                for (var i = 0, j = _init.caches.length; i < j; i++) {
                    _init.caches[i].apply(this, arguments)
                }
            }, initNode: function (setting, level, node, parentNode, preNode, nextNode) {
                for (var i = 0, j = _init.nodes.length; i < j; i++) {
                    _init.nodes[i].apply(this, arguments)
                }
            }, initRoot: function (setting) {
                for (var i = 0, j = _init.roots.length; i < j; i++) {
                    _init.roots[i].apply(this, arguments)
                }
            }, isSelectedNode: function (setting, node) {
                var root = data.getRoot(setting);
                for (var i = 0, j = root.curSelectedList.length; i < j; i++) {
                    if (node === root.curSelectedList[i]) {
                        return true
                    }
                }
                return false
            }, removeNodeCache: function (setting, node) {
                var childKey = setting.data.key.children;
                if (node[childKey]) {
                    for (var i = 0, l = node[childKey].length; i < l; i++) {
                        arguments.callee(setting, node[childKey][i])
                    }
                }
                data.getCache(setting).nodes[data.getNodeCacheId(node.tId)] = null
            }, removeSelectedNode: function (setting, node) {
                var root = data.getRoot(setting);
                for (var i = 0, j = root.curSelectedList.length; i < j; i++) {
                    if (node === root.curSelectedList[i] || !data.getNodeCache(setting, root.curSelectedList[i].tId)) {
                        root.curSelectedList.splice(i, 1);
                        i--;
                        j--
                    }
                }
            }, setCache: function (setting, cache) {
                caches[setting.treeId] = cache
            }, setRoot: function (setting, root) {
                roots[setting.treeId] = root
            }, setZTreeTools: function (setting, zTreeTools) {
                for (var i = 0, j = _init.zTreeTools.length; i < j; i++) {
                    _init.zTreeTools[i].apply(this, arguments)
                }
            }, transformToArrayFormat: function (setting, nodes) {
                if (!nodes) {
                    return []
                }
                var childKey = setting.data.key.children,
                    r = [];
                if (tools.isArray(nodes)) {
                    for (var i = 0, l = nodes.length; i < l; i++) {
                        r.push(nodes[i]);
                        if (nodes[i][childKey]) {
                            r = r.concat(data.transformToArrayFormat(setting, nodes[i][childKey]))
                        }
                    }
                } else {
                    r.push(nodes);
                    if (nodes[childKey]) {
                        r = r.concat(data.transformToArrayFormat(setting, nodes[childKey]))
                    }
                }
                return r
            }, transformTozTreeFormat: function (setting, sNodes) {
                var i, l, key = setting.data.simpleData.idKey,
                    parentKey = setting.data.simpleData.pIdKey,
                    childKey = setting.data.key.children;
                if (!key || key == "" || !sNodes) {
                    return []
                }
                if (tools.isArray(sNodes)) {
                    var r = [];
                    var tmpMap = [];
                    for (i = 0, l = sNodes.length; i < l; i++) {
                        tmpMap[sNodes[i][key]] = sNodes[i]
                    }
                    for (i = 0, l = sNodes.length; i < l; i++) {
                        if (tmpMap[sNodes[i][parentKey]] && sNodes[i][key] != sNodes[i][parentKey]) {
                            if (!tmpMap[sNodes[i][parentKey]][childKey]) {
                                tmpMap[sNodes[i][parentKey]][childKey] = []
                            }
                            tmpMap[sNodes[i][parentKey]][childKey].push(sNodes[i])
                        } else {
                            r.push(sNodes[i])
                        }
                    }
                    return r
                } else {
                    return [sNodes]
                }
            }
        },
        event = {
            bindEvent: function (setting) {
                for (var i = 0, j = _init.bind.length; i < j; i++) {
                    _init.bind[i].apply(this, arguments)
                }
            }, unbindEvent: function (setting) {
                for (var i = 0, j = _init.unbind.length; i < j; i++) {
                    _init.unbind[i].apply(this, arguments)
                }
            }, bindTree: function (setting) {
                var eventParam = {
                        treeId: setting.treeId
                    },
                    o = setting.treeObj;
                o.bind("selectstart", function (e) {
                    var n = e.originalEvent.srcElement.nodeName.toLowerCase();
                    return (n === "input" || n === "textarea")
                }).css({
                    "-moz-user-select": "-moz-none"
                });
                o.bind("click", eventParam, event.proxy);
                o.bind("dblclick", eventParam, event.proxy);
                o.bind("mouseover", eventParam, event.proxy);
                o.bind("mouseout", eventParam, event.proxy);
                o.bind("mousedown", eventParam, event.proxy);
                o.bind("mouseup", eventParam, event.proxy);
                o.bind("contextmenu", eventParam, event.proxy)
            }, unbindTree: function (setting) {
                var o = setting.treeObj;
                o.unbind("click", event.proxy).unbind("dblclick", event.proxy).unbind("mouseover", event.proxy).unbind("mouseout", event.proxy).unbind("mousedown", event.proxy).unbind("mouseup", event.proxy).unbind("contextmenu", event.proxy)
            }, doProxy: function (e) {
                var results = [];
                for (var i = 0, j = _init.proxys.length; i < j; i++) {
                    var proxyResult = _init.proxys[i].apply(this, arguments);
                    results.push(proxyResult);
                    if (proxyResult.stop) {
                        break
                    }
                }
                return results
            }, proxy: function (e) {
                var setting = data.getSetting(e.data.treeId);
                if (!tools.uCanDo(setting, e)) {
                    return true
                }
                var results = event.doProxy(e),
                    r = true,
                    x = false;
                for (var i = 0, l = results.length; i < l; i++) {
                    var proxyResult = results[i];
                    if (proxyResult.nodeEventCallback) {
                        x = true;
                        r = proxyResult.nodeEventCallback.apply(proxyResult, [e, proxyResult.node]) && r
                    }
                    if (proxyResult.treeEventCallback) {
                        x = true;
                        r = proxyResult.treeEventCallback.apply(proxyResult, [e, proxyResult.node]) && r
                    }
                }
                return r
            }
        },
        handler = {
            onSwitchNode: function (event, node) {
                var setting = data.getSetting(event.data.treeId);
                if (node.open) {
                    if (tools.apply(setting.callback.beforeCollapse, [setting.treeId, node], true) == false) {
                        return true
                    }
                    data.getRoot(setting).expandTriggerFlag = true;
                    view.switchNode(setting, node)
                } else {
                    if (tools.apply(setting.callback.beforeExpand, [setting.treeId, node], true) == false) {
                        return true
                    }
                    data.getRoot(setting).expandTriggerFlag = true;
                    view.switchNode(setting, node)
                }
                return true
            }, onClickNode: function (event, node) {
                var setting = data.getSetting(event.data.treeId),
                    clickFlag = ((setting.view.autoCancelSelected && event.ctrlKey) && data.isSelectedNode(setting, node)) ? 0 : (setting.view.autoCancelSelected && event.ctrlKey && setting.view.selectedMulti) ? 2 : 1;
                if (tools.apply(setting.callback.beforeClick, [setting.treeId, node, clickFlag], true) == false) {
                    return true
                }
                if (clickFlag === 0) {
                    view.cancelPreSelectedNode(setting, node)
                } else {
                    view.selectNode(setting, node, clickFlag === 2)
                }
                setting.treeObj.trigger(consts.event.CLICK, [event, setting.treeId, node, clickFlag]);
                return true
            }, onZTreeMousedown: function (event, node) {
                var setting = data.getSetting(event.data.treeId);
                if (tools.apply(setting.callback.beforeMouseDown, [setting.treeId, node], true)) {
                    tools.apply(setting.callback.onMouseDown, [event, setting.treeId, node])
                }
                return true
            }, onZTreeMouseup: function (event, node) {
                var setting = data.getSetting(event.data.treeId);
                if (tools.apply(setting.callback.beforeMouseUp, [setting.treeId, node], true)) {
                    tools.apply(setting.callback.onMouseUp, [event, setting.treeId, node])
                }
                return true
            }, onZTreeDblclick: function (event, node) {
                var setting = data.getSetting(event.data.treeId);
                if (tools.apply(setting.callback.beforeDblClick, [setting.treeId, node], true)) {
                    tools.apply(setting.callback.onDblClick, [event, setting.treeId, node])
                }
                return true
            }, onZTreeContextmenu: function (event, node) {
                var setting = data.getSetting(event.data.treeId);
                if (tools.apply(setting.callback.beforeRightClick, [setting.treeId, node], true)) {
                    tools.apply(setting.callback.onRightClick, [event, setting.treeId, node])
                }
                return (typeof setting.callback.onRightClick) != "function"
            }
        },
        tools = {
            apply: function (fun, param, defaultValue) {
                if ((typeof fun) == "function") {
                    return fun.apply(zt, param ? param : [])
                }
                return defaultValue
            }, canAsync: function (setting, node) {
                var childKey = setting.data.key.children;
                return (setting.async.enable && node && node.isParent && !(node.zAsync || (node[childKey] && node[childKey].length > 0)))
            }, clone: function (obj) {
                if (obj === null) {
                    return null
                }
                var o = tools.isArray(obj) ? [] : {};
                for (var i in obj) {
                    o[i] = (obj[i] instanceof Date) ? new Date(obj[i].getTime()) : (typeof obj[i] === "object" ? arguments.callee(obj[i]) : obj[i])
                }
                return o
            }, eqs: function (str1, str2) {
                return str1.toLowerCase() === str2.toLowerCase()
            }, isArray: function (arr) {
                return Object.prototype.toString.apply(arr) === "[object Array]"
            }, $: function (node, exp, setting) {
                if (!!exp && typeof exp != "string") {
                    setting = exp;
                    exp = ""
                }
                if (typeof node == "string") {
                    return $(node, setting ? setting.treeObj.get(0).ownerDocument : null)
                } else {
                    return $("#" + node.tId + exp, setting ? setting.treeObj : null)
                }
            }, getMDom: function (setting, curDom, targetExpr) {
                if (!curDom) {
                    return null
                }
                while (curDom && curDom.id !== setting.treeId) {
                    for (var i = 0, l = targetExpr.length; curDom.tagName && i < l; i++) {
                        if (tools.eqs(curDom.tagName, targetExpr[i].tagName) && curDom.getAttribute(targetExpr[i].attrName) !== null) {
                            return curDom
                        }
                    }
                    curDom = curDom.parentNode
                }
                return null
            }, getNodeMainDom: function (target) {
                return ($(target).parent("li").get(0) || $(target).parentsUntil("li").parent().get(0))
            }, uCanDo: function (setting, e) {
                return true
            }
        },
        view = {
            addNodes: function (setting, parentNode, newNodes, isSilent) {
                if (setting.data.keep.leaf && parentNode && !parentNode.isParent) {
                    return
                }
                if (!tools.isArray(newNodes)) {
                    newNodes = [newNodes]
                }
                if (setting.data.simpleData.enable) {
                    newNodes = data.transformTozTreeFormat(setting, newNodes)
                }
                if (parentNode) {
                    var target_switchObj = $$(parentNode, consts.id.SWITCH, setting),
                        target_icoObj = $$(parentNode, consts.id.ICON, setting),
                        target_ulObj = $$(parentNode, consts.id.UL, setting);
                    if (!parentNode.open) {
                        view.replaceSwitchClass(parentNode, target_switchObj, consts.folder.CLOSE);
                        view.replaceIcoClass(parentNode, target_icoObj, consts.folder.CLOSE);
                        parentNode.open = false;
                        target_ulObj.css({
                            display: "none"
                        })
                    }
                    data.addNodesData(setting, parentNode, newNodes);
                    view.createNodes(setting, parentNode.level + 1, newNodes, parentNode);
                    if (!isSilent) {
                        view.expandCollapseParentNode(setting, parentNode, true)
                    }
                } else {
                    data.addNodesData(setting, data.getRoot(setting), newNodes);
                    view.createNodes(setting, 0, newNodes, null)
                }
            }, appendNodes: function (setting, level, nodes, parentNode, initFlag, openFlag) {
                if (!nodes) {
                    return []
                }
                var html = [],
                    childKey = setting.data.key.children;
                for (var i = 0, l = nodes.length; i < l; i++) {
                    var node = nodes[i];
                    if (initFlag) {
                        var tmpPNode = (parentNode) ? parentNode : data.getRoot(setting),
                            tmpPChild = tmpPNode[childKey],
                            isFirstNode = ((tmpPChild.length == nodes.length) && (i == 0)),
                            isLastNode = (i == (nodes.length - 1));
                        data.initNode(setting, level, node, parentNode, isFirstNode, isLastNode, openFlag);
                        data.addNodeCache(setting, node)
                    }
                    var childHtml = [];
                    if (node[childKey] && node[childKey].length > 0) {
                        childHtml = view.appendNodes(setting, level + 1, node[childKey], node, initFlag, openFlag && node.open)
                    }
                    if (openFlag) {
                        view.makeDOMNodeMainBefore(html, setting, node);
                        view.makeDOMNodeLine(html, setting, node);
                        data.getBeforeA(setting, node, html);
                        view.makeDOMNodeNameBefore(html, setting, node);
                        data.getInnerBeforeA(setting, node, html);
                        view.makeDOMNodeIcon(html, setting, node);
                        data.getInnerAfterA(setting, node, html);
                        view.makeDOMNodeNameAfter(html, setting, node);
                        data.getAfterA(setting, node, html);
                        if (node.isParent && node.open) {
                            view.makeUlHtml(setting, node, html, childHtml.join(""))
                        }
                        view.makeDOMNodeMainAfter(html, setting, node);
                        data.addCreatedNode(setting, node)
                    }
                }
                return html
            }, appendParentULDom: function (setting, node) {
                var html = [],
                    nObj = $$(node, setting);
                if (!nObj.get(0) && !!node.parentTId) {
                    view.appendParentULDom(setting, node.getParentNode());
                    nObj = $$(node, setting)
                }
                var ulObj = $$(node, consts.id.UL, setting);
                if (ulObj.get(0)) {
                    ulObj.remove()
                }
                var childKey = setting.data.key.children,
                    childHtml = view.appendNodes(setting, node.level + 1, node[childKey], node, false, true);
                view.makeUlHtml(setting, node, html, childHtml.join(""));
                nObj.append(html.join(""))
            }, asyncNode: function (setting, node, isSilent, callback) {
                var i, l;
                if (node && !node.isParent) {
                    tools.apply(callback);
                    return false
                } else {
                    if (node && node.isAjaxing) {
                        return false
                    } else {
                        if (tools.apply(setting.callback.beforeAsync, [setting.treeId, node], true) == false) {
                            tools.apply(callback);
                            return false
                        }
                    }
                } if (node) {
                    node.isAjaxing = true;
                    var icoObj = $$(node, consts.id.ICON, setting);
                    icoObj.attr({
                        style: "",
                        "class": consts.className.BUTTON + " " + consts.className.ICO_LOADING
                    })
                }
                var tmpParam = {};
                for (i = 0, l = setting.async.autoParam.length; node && i < l; i++) {
                    var pKey = setting.async.autoParam[i].split("="),
                        spKey = pKey;
                    if (pKey.length > 1) {
                        spKey = pKey[1];
                        pKey = pKey[0]
                    }
                    tmpParam[spKey] = node[pKey]
                }
                if (tools.isArray(setting.async.otherParam)) {
                    for (i = 0, l = setting.async.otherParam.length; i < l; i += 2) {
                        tmpParam[setting.async.otherParam[i]] = setting.async.otherParam[i + 1]
                    }
                } else {
                    for (var p in setting.async.otherParam) {
                        tmpParam[p] = setting.async.otherParam[p]
                    }
                }
                var _tmpV = data.getRoot(setting)._ver;
                $.ajax({
                    contentType: setting.async.contentType,
                    type: setting.async.type,
                    url: tools.apply(setting.async.url, [setting.treeId, node], setting.async.url),
                    data: tmpParam,
                    dataType: setting.async.dataType,
                    success: function (msg) {
                        if (_tmpV != data.getRoot(setting)._ver) {
                            return
                        }
                        var newNodes = [];
                        try {
                            if (!msg || msg.length == 0) {
                                newNodes = []
                            } else {
                                if (setting.async.dataName) {
                                    if (typeof msg == "string") {
                                        newNodes = eval("(" + msg + ")")[setting.async.dataName]
                                    } else {
                                        newNodes = msg[setting.async.dataName]
                                    }
                                } else {
                                    if (typeof msg == "string") {
                                        newNodes = eval("(" + msg + ")")
                                    } else {
                                        newNodes = msg
                                    }
                                }
                            }
                        } catch (err) {
                            newNodes = msg
                        }
                        if (node) {
                            node.isAjaxing = null;
                            node.zAsync = true
                        }
                        view.setNodeLineIcos(setting, node);
                        if (newNodes && newNodes !== "") {
                            newNodes = tools.apply(setting.async.dataFilter, [setting.treeId, node, newNodes], newNodes);
                            view.addNodes(setting, node, !!newNodes ? tools.clone(newNodes) : [], !!isSilent)
                        } else {
                            view.addNodes(setting, node, [], !!isSilent)
                        }
                        setting.treeObj.trigger(consts.event.ASYNC_SUCCESS, [setting.treeId, node, msg]);
                        tools.apply(callback)
                    }, error: function (XMLHttpRequest, textStatus, errorThrown) {
                        if (_tmpV != data.getRoot(setting)._ver) {
                            return
                        }
                        if (node) {
                            node.isAjaxing = null
                        }
                        view.setNodeLineIcos(setting, node);
                        setting.treeObj.trigger(consts.event.ASYNC_ERROR, [setting.treeId, node, XMLHttpRequest, textStatus, errorThrown])
                    }
                });
                return true
            }, cancelPreSelectedNode: function (setting, node) {
                var list = data.getRoot(setting).curSelectedList;
                for (var i = 0, j = list.length - 1; j >= i; j--) {
                    if (!node || node === list[j]) {
                        $$(list[j], consts.id.A, setting).removeClass(consts.node.CURSELECTED);
                        if (node) {
                            data.removeSelectedNode(setting, node);
                            break
                        }
                    }
                }
                if (!node) {
                    data.getRoot(setting).curSelectedList = []
                }
            }, createNodeCallback: function (setting) {
                if (!!setting.callback.onNodeCreated || !!setting.view.addDiyDom) {
                    var root = data.getRoot(setting);
                    while (root.createdNodes.length > 0) {
                        var node = root.createdNodes.shift();
                        tools.apply(setting.view.addDiyDom, [setting.treeId, node]);
                        if (!!setting.callback.onNodeCreated) {
                            setting.treeObj.trigger(consts.event.NODECREATED, [setting.treeId, node])
                        }
                    }
                }
            }, createNodes: function (setting, level, nodes, parentNode) {
                if (!nodes || nodes.length == 0) {
                    return
                }
                var root = data.getRoot(setting),
                    childKey = setting.data.key.children,
                    openFlag = !parentNode || parentNode.open || !!$$(parentNode[childKey][0], setting).get(0);
                root.createdNodes = [];
                var zTreeHtml = view.appendNodes(setting, level, nodes, parentNode, true, openFlag);
                if (!parentNode) {
                    setting.treeObj.append(zTreeHtml.join(""))
                } else {
                    var ulObj = $$(parentNode, consts.id.UL, setting);
                    if (ulObj.get(0)) {
                        ulObj.append(zTreeHtml.join(""))
                    }
                }
                view.createNodeCallback(setting)
            }, destroy: function (setting) {
                if (!setting) {
                    return
                }
                data.initCache(setting);
                data.initRoot(setting);
                event.unbindTree(setting);
                event.unbindEvent(setting);
                setting.treeObj.empty()
            }, expandCollapseNode: function (setting, node, expandFlag, animateFlag, callback) {
                var root = data.getRoot(setting),
                    childKey = setting.data.key.children;
                if (!node) {
                    tools.apply(callback, []);
                    return
                }
                if (root.expandTriggerFlag) {
                    var _callback = callback;
                    callback = function () {
                        if (_callback) {
                            _callback()
                        }
                        if (node.open) {
                            setting.treeObj.trigger(consts.event.EXPAND, [setting.treeId, node])
                        } else {
                            setting.treeObj.trigger(consts.event.COLLAPSE, [setting.treeId, node])
                        }
                    };
                    root.expandTriggerFlag = false
                }
                if (!node.open && node.isParent && ((!$$(node, consts.id.UL, setting).get(0)) || (node[childKey] && node[childKey].length > 0 && !$$(node[childKey][0], setting).get(0)))) {
                    view.appendParentULDom(setting, node);
                    view.createNodeCallback(setting)
                }
                if (node.open == expandFlag) {
                    tools.apply(callback, []);
                    return
                }
                var ulObj = $$(node, consts.id.UL, setting),
                    switchObj = $$(node, consts.id.SWITCH, setting),
                    icoObj = $$(node, consts.id.ICON, setting);
                if (node.isParent) {
                    node.open = !node.open;
                    if (node.iconOpen && node.iconClose) {
                        icoObj.attr("style", view.makeNodeIcoStyle(setting, node))
                    }
                    if (node.open) {
                        view.replaceSwitchClass(node, switchObj, consts.folder.OPEN);
                        view.replaceIcoClass(node, icoObj, consts.folder.OPEN);
                        if (animateFlag == false || setting.view.expandSpeed == "") {
                            ulObj.show();
                            tools.apply(callback, [])
                        } else {
                            if (node[childKey] && node[childKey].length > 0) {
                                ulObj.slideDown(setting.view.expandSpeed, callback)
                            } else {
                                ulObj.show();
                                tools.apply(callback, [])
                            }
                        }
                    } else {
                        view.replaceSwitchClass(node, switchObj, consts.folder.CLOSE);
                        view.replaceIcoClass(node, icoObj, consts.folder.CLOSE);
                        if (animateFlag == false || setting.view.expandSpeed == "" || !(node[childKey] && node[childKey].length > 0)) {
                            ulObj.hide();
                            tools.apply(callback, [])
                        } else {
                            ulObj.slideUp(setting.view.expandSpeed, callback)
                        }
                    }
                } else {
                    tools.apply(callback, [])
                }
            }, expandCollapseParentNode: function (setting, node, expandFlag, animateFlag, callback) {
                if (!node) {
                    return
                }
                if (!node.parentTId) {
                    view.expandCollapseNode(setting, node, expandFlag, animateFlag, callback);
                    return
                } else {
                    view.expandCollapseNode(setting, node, expandFlag, animateFlag)
                } if (node.parentTId) {
                    view.expandCollapseParentNode(setting, node.getParentNode(), expandFlag, animateFlag, callback)
                }
            }, expandCollapseSonNode: function (setting, node, expandFlag, animateFlag, callback) {
                var root = data.getRoot(setting),
                    childKey = setting.data.key.children,
                    treeNodes = (node) ? node[childKey] : root[childKey],
                    selfAnimateSign = (node) ? false : animateFlag,
                    expandTriggerFlag = data.getRoot(setting).expandTriggerFlag;
                data.getRoot(setting).expandTriggerFlag = false;
                if (treeNodes) {
                    for (var i = 0, l = treeNodes.length; i < l; i++) {
                        if (treeNodes[i]) {
                            view.expandCollapseSonNode(setting, treeNodes[i], expandFlag, selfAnimateSign)
                        }
                    }
                }
                data.getRoot(setting).expandTriggerFlag = expandTriggerFlag;
                view.expandCollapseNode(setting, node, expandFlag, animateFlag, callback)
            }, makeDOMNodeIcon: function (html, setting, node) {
                var nameStr = data.getNodeName(setting, node),
                    name = setting.view.nameIsHTML ? nameStr : nameStr.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                html.push("<span id='", node.tId, consts.id.ICON, "' title='' treeNode", consts.id.ICON, " class='", view.makeNodeIcoClass(setting, node), "' style='", view.makeNodeIcoStyle(setting, node), "'></span><span id='", node.tId, consts.id.SPAN, "'>", name, "</span>")
            }, makeDOMNodeLine: function (html, setting, node) {
                html.push("<span id='", node.tId, consts.id.SWITCH, "' title='' class='", view.makeNodeLineClass(setting, node), "' treeNode", consts.id.SWITCH, "></span>")
            }, makeDOMNodeMainAfter: function (html, setting, node) {
                html.push("</li>")
            }, makeDOMNodeMainBefore: function (html, setting, node) {
                html.push("<li id='", node.tId, "' class='", consts.className.LEVEL, node.level, "' tabindex='0' hidefocus='true' treenode>")
            }, makeDOMNodeNameAfter: function (html, setting, node) {
                html.push("</a>")
            }, makeDOMNodeNameBefore: function (html, setting, node) {
                var title = data.getNodeTitle(setting, node),
                    url = view.makeNodeUrl(setting, node),
                    fontcss = view.makeNodeFontCss(setting, node),
                    fontStyle = [];
                for (var f in fontcss) {
                    fontStyle.push(f, ":", fontcss[f], ";")
                }
                html.push("<a id='", node.tId, consts.id.A, "' class='", consts.className.LEVEL, node.level, "' treeNode", consts.id.A, ' onclick="', (node.click || ""), '" ', ((url != null && url.length > 0) ? "href='" + url + "'" : ""), " target='", view.makeNodeTarget(node), "' style='", fontStyle.join(""), "'");
                if (tools.apply(setting.view.showTitle, [setting.treeId, node], setting.view.showTitle) && title) {
                    html.push("title='", title.replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;"), "'")
                }
                html.push(">")
            }, makeNodeFontCss: function (setting, node) {
                var fontCss = tools.apply(setting.view.fontCss, [setting.treeId, node], setting.view.fontCss);
                return (fontCss && ((typeof fontCss) != "function")) ? fontCss : {}
            }, makeNodeIcoClass: function (setting, node) {
                var icoCss = ["ico"];
                if (!node.isAjaxing) {
                    icoCss[0] = (node.iconSkin ? node.iconSkin + "_" : "") + icoCss[0];
                    if (node.isParent) {
                        icoCss.push(node.open ? consts.folder.OPEN : consts.folder.CLOSE)
                    } else {
                        icoCss.push(consts.folder.DOCU)
                    }
                }
                return consts.className.BUTTON + " " + icoCss.join("_")
            }, makeNodeIcoStyle: function (setting, node) {
                var icoStyle = [];
                if (!node.isAjaxing) {
                    var icon = (node.isParent && node.iconOpen && node.iconClose) ? (node.open ? node.iconOpen : node.iconClose) : node.icon;
                    if (icon) {
                        icoStyle.push("background:url(", icon, ") 0 0 no-repeat;")
                    }
                    if (setting.view.showIcon == false || !tools.apply(setting.view.showIcon, [setting.treeId, node], true)) {
                        icoStyle.push("width:0px;height:0px;")
                    }
                }
                return icoStyle.join("")
            }, makeNodeLineClass: function (setting, node) {
                var lineClass = [];
                if (setting.view.showLine) {
                    if (node.level == 0 && node.isFirstNode && node.isLastNode) {
                        lineClass.push(consts.line.ROOT)
                    } else {
                        if (node.level == 0 && node.isFirstNode) {
                            lineClass.push(consts.line.ROOTS)
                        } else {
                            if (node.isLastNode) {
                                lineClass.push(consts.line.BOTTOM)
                            } else {
                                lineClass.push(consts.line.CENTER)
                            }
                        }
                    }
                } else {
                    lineClass.push(consts.line.NOLINE)
                } if (node.isParent) {
                    lineClass.push(node.open ? consts.folder.OPEN : consts.folder.CLOSE)
                } else {
                    lineClass.push(consts.folder.DOCU)
                }
                return view.makeNodeLineClassEx(node) + lineClass.join("_")
            }, makeNodeLineClassEx: function (node) {
                return consts.className.BUTTON + " " + consts.className.LEVEL + node.level + " " + consts.className.SWITCH + " "
            }, makeNodeTarget: function (node) {
                return (node.target || "_blank")
            }, makeNodeUrl: function (setting, node) {
                var urlKey = setting.data.key.url;
                return node[urlKey] ? node[urlKey] : null
            }, makeUlHtml: function (setting, node, html, content) {
                html.push("<ul id='", node.tId, consts.id.UL, "' class='", consts.className.LEVEL, node.level, " ", view.makeUlLineClass(setting, node), "' style='display:", (node.open ? "block" : "none"), "'>");
                html.push(content);
                html.push("</ul>")
            }, makeUlLineClass: function (setting, node) {
                return ((setting.view.showLine && !node.isLastNode) ? consts.line.LINE : "")
            }, removeChildNodes: function (setting, node) {
                if (!node) {
                    return
                }
                var childKey = setting.data.key.children,
                    nodes = node[childKey];
                if (!nodes) {
                    return
                }
                for (var i = 0, l = nodes.length; i < l; i++) {
                    data.removeNodeCache(setting, nodes[i])
                }
                data.removeSelectedNode(setting);
                delete node[childKey];
                if (!setting.data.keep.parent) {
                    node.isParent = false;
                    node.open = false;
                    var tmp_switchObj = $$(node, consts.id.SWITCH, setting),
                        tmp_icoObj = $$(node, consts.id.ICON, setting);
                    view.replaceSwitchClass(node, tmp_switchObj, consts.folder.DOCU);
                    view.replaceIcoClass(node, tmp_icoObj, consts.folder.DOCU);
                    $$(node, consts.id.UL, setting).remove()
                } else {
                    $$(node, consts.id.UL, setting).empty()
                }
            }, setFirstNode: function (setting, parentNode) {
                var childKey = setting.data.key.children,
                    childLength = parentNode[childKey].length;
                if (childLength > 0) {
                    parentNode[childKey][0].isFirstNode = true
                }
            }, setLastNode: function (setting, parentNode) {
                var childKey = setting.data.key.children,
                    childLength = parentNode[childKey].length;
                if (childLength > 0) {
                    parentNode[childKey][childLength - 1].isLastNode = true
                }
            }, removeNode: function (setting, node) {
                var root = data.getRoot(setting),
                    childKey = setting.data.key.children,
                    parentNode = (node.parentTId) ? node.getParentNode() : root;
                node.isFirstNode = false;
                node.isLastNode = false;
                node.getPreNode = function () {
                    return null
                };
                node.getNextNode = function () {
                    return null
                };
                if (!data.getNodeCache(setting, node.tId)) {
                    return
                }
                $$(node, setting).remove();
                data.removeNodeCache(setting, node);
                data.removeSelectedNode(setting, node);
                for (var i = 0, l = parentNode[childKey].length; i < l; i++) {
                    if (parentNode[childKey][i].tId == node.tId) {
                        parentNode[childKey].splice(i, 1);
                        break
                    }
                }
                view.setFirstNode(setting, parentNode);
                view.setLastNode(setting, parentNode);
                var tmp_ulObj, tmp_switchObj, tmp_icoObj, childLength = parentNode[childKey].length;
                if (!setting.data.keep.parent && childLength == 0) {
                    parentNode.isParent = false;
                    parentNode.open = false;
                    tmp_ulObj = $$(parentNode, consts.id.UL, setting);
                    tmp_switchObj = $$(parentNode, consts.id.SWITCH, setting);
                    tmp_icoObj = $$(parentNode, consts.id.ICON, setting);
                    view.replaceSwitchClass(parentNode, tmp_switchObj, consts.folder.DOCU);
                    view.replaceIcoClass(parentNode, tmp_icoObj, consts.folder.DOCU);
                    tmp_ulObj.css("display", "none")
                } else {
                    if (setting.view.showLine && childLength > 0) {
                        var newLast = parentNode[childKey][childLength - 1];
                        tmp_ulObj = $$(newLast, consts.id.UL, setting);
                        tmp_switchObj = $$(newLast, consts.id.SWITCH, setting);
                        tmp_icoObj = $$(newLast, consts.id.ICON, setting);
                        if (parentNode == root) {
                            if (parentNode[childKey].length == 1) {
                                view.replaceSwitchClass(newLast, tmp_switchObj, consts.line.ROOT)
                            } else {
                                var tmp_first_switchObj = $$(parentNode[childKey][0], consts.id.SWITCH, setting);
                                view.replaceSwitchClass(parentNode[childKey][0], tmp_first_switchObj, consts.line.ROOTS);
                                view.replaceSwitchClass(newLast, tmp_switchObj, consts.line.BOTTOM)
                            }
                        } else {
                            view.replaceSwitchClass(newLast, tmp_switchObj, consts.line.BOTTOM)
                        }
                        tmp_ulObj.removeClass(consts.line.LINE)
                    }
                }
            }, replaceIcoClass: function (node, obj, newName) {
                if (!obj || node.isAjaxing) {
                    return
                }
                var tmpName = obj.attr("class");
                if (tmpName == undefined) {
                    return
                }
                var tmpList = tmpName.split("_");
                switch (newName) {
                    case consts.folder.OPEN:
                    case consts.folder.CLOSE:
                    case consts.folder.DOCU:
                        tmpList[tmpList.length - 1] = newName;
                        break
                }
                obj.attr("class", tmpList.join("_"))
            }, replaceSwitchClass: function (node, obj, newName) {
                if (!obj) {
                    return
                }
                var tmpName = obj.attr("class");
                if (tmpName == undefined) {
                    return
                }
                var tmpList = tmpName.split("_");
                switch (newName) {
                    case consts.line.ROOT:
                    case consts.line.ROOTS:
                    case consts.line.CENTER:
                    case consts.line.BOTTOM:
                    case consts.line.NOLINE:
                        tmpList[0] = view.makeNodeLineClassEx(node) + newName;
                        break;
                    case consts.folder.OPEN:
                    case consts.folder.CLOSE:
                    case consts.folder.DOCU:
                        tmpList[1] = newName;
                        break
                }
                obj.attr("class", tmpList.join("_"));
                if (newName !== consts.folder.DOCU) {
                    obj.removeAttr("disabled")
                } else {
                    obj.attr("disabled", "disabled")
                }
            }, selectNode: function (setting, node, addFlag) {
                if (!addFlag) {
                    view.cancelPreSelectedNode(setting)
                }
                $$(node, consts.id.A, setting).addClass(consts.node.CURSELECTED);
                data.addSelectedNode(setting, node)
            }, setNodeFontCss: function (setting, treeNode) {
                var aObj = $$(treeNode, consts.id.A, setting),
                    fontCss = view.makeNodeFontCss(setting, treeNode);
                if (fontCss) {
                    aObj.css(fontCss)
                }
            }, setNodeLineIcos: function (setting, node) {
                if (!node) {
                    return
                }
                var switchObj = $$(node, consts.id.SWITCH, setting),
                    ulObj = $$(node, consts.id.UL, setting),
                    icoObj = $$(node, consts.id.ICON, setting),
                    ulLine = view.makeUlLineClass(setting, node);
                if (ulLine.length == 0) {
                    ulObj.removeClass(consts.line.LINE)
                } else {
                    ulObj.addClass(ulLine)
                }
                switchObj.attr("class", view.makeNodeLineClass(setting, node));
                if (node.isParent) {
                    switchObj.removeAttr("disabled")
                } else {
                    switchObj.attr("disabled", "disabled")
                }
                icoObj.removeAttr("style");
                icoObj.attr("style", view.makeNodeIcoStyle(setting, node));
                icoObj.attr("class", view.makeNodeIcoClass(setting, node))
            }, setNodeName: function (setting, node) {
                var title = data.getNodeTitle(setting, node),
                    nObj = $$(node, consts.id.SPAN, setting);
                nObj.empty();
                if (setting.view.nameIsHTML) {
                    nObj.html(data.getNodeName(setting, node))
                } else {
                    nObj.text(data.getNodeName(setting, node))
                } if (tools.apply(setting.view.showTitle, [setting.treeId, node], setting.view.showTitle)) {
                    var aObj = $$(node, consts.id.A, setting);
                    aObj.attr("title", !title ? "" : title)
                }
            }, setNodeTarget: function (setting, node) {
                var aObj = $$(node, consts.id.A, setting);
                aObj.attr("target", view.makeNodeTarget(node))
            }, setNodeUrl: function (setting, node) {
                var aObj = $$(node, consts.id.A, setting),
                    url = view.makeNodeUrl(setting, node);
                if (url == null || url.length == 0) {
                    aObj.removeAttr("href")
                } else {
                    aObj.attr("href", url)
                }
            }, switchNode: function (setting, node) {
                if (node.open || !tools.canAsync(setting, node)) {
                    view.expandCollapseNode(setting, node, !node.open)
                } else {
                    if (setting.async.enable) {
                        if (!view.asyncNode(setting, node)) {
                            view.expandCollapseNode(setting, node, !node.open);
                            return
                        }
                    } else {
                        if (node) {
                            view.expandCollapseNode(setting, node, !node.open)
                        }
                    }
                }
            }
        };
    $.fn.zTree = {
        consts: _consts,
        _z: {
            tools: tools,
            view: view,
            event: event,
            data: data
        },
        getZTreeObj: function (treeId) {
            var o = data.getZTreeTools(treeId);
            return o ? o : null
        }, destroy: function (treeId) {
            if (!!treeId && treeId.length > 0) {
                view.destroy(data.getSetting(treeId))
            } else {
                for (var s in settings) {
                    view.destroy(settings[s])
                }
            }
        }, init: function (obj, zSetting, zNodes) {
            var setting = tools.clone(_setting);
            $.extend(true, setting, zSetting);
            setting.treeId = obj.attr("id");
            setting.treeObj = obj;
            setting.treeObj.empty();
            settings[setting.treeId] = setting;
            if (typeof document.body.style.maxHeight === "undefined") {
                setting.view.expandSpeed = ""
            }
            data.initRoot(setting);
            var root = data.getRoot(setting),
                childKey = setting.data.key.children;
            zNodes = zNodes ? tools.clone(tools.isArray(zNodes) ? zNodes : [zNodes]) : [];
            if (setting.data.simpleData.enable) {
                root[childKey] = data.transformTozTreeFormat(setting, zNodes)
            } else {
                root[childKey] = zNodes
            }
            data.initCache(setting);
            event.unbindTree(setting);
            event.bindTree(setting);
            event.unbindEvent(setting);
            event.bindEvent(setting);
            var zTreeTools = {
                setting: setting,
                addNodes: function (parentNode, newNodes, isSilent) {
                    if (!newNodes) {
                        return null
                    }
                    if (!parentNode) {
                        parentNode = null
                    }
                    if (parentNode && !parentNode.isParent && setting.data.keep.leaf) {
                        return null
                    }
                    var xNewNodes = tools.clone(tools.isArray(newNodes) ? newNodes : [newNodes]);

                    function addCallback() {
                        view.addNodes(setting, parentNode, xNewNodes, (isSilent == true))
                    }
                    if (tools.canAsync(setting, parentNode)) {
                        view.asyncNode(setting, parentNode, isSilent, addCallback)
                    } else {
                        addCallback()
                    }
                    return xNewNodes
                }, cancelSelectedNode: function (node) {
                    view.cancelPreSelectedNode(setting, node)
                }, destroy: function () {
                    view.destroy(setting)
                }, expandAll: function (expandFlag) {
                    expandFlag = !!expandFlag;
                    view.expandCollapseSonNode(setting, null, expandFlag, true);
                    return expandFlag
                }, expandNode: function (node, expandFlag, sonSign, focus, callbackFlag) {
                    if (!node || !node.isParent) {
                        return null
                    }
                    if (expandFlag !== true && expandFlag !== false) {
                        expandFlag = !node.open
                    }
                    callbackFlag = !!callbackFlag;
                    if (callbackFlag && expandFlag && (tools.apply(setting.callback.beforeExpand, [setting.treeId, node], true) == false)) {
                        return null
                    } else {
                        if (callbackFlag && !expandFlag && (tools.apply(setting.callback.beforeCollapse, [setting.treeId, node], true) == false)) {
                            return null
                        }
                    } if (expandFlag && node.parentTId) {
                        view.expandCollapseParentNode(setting, node.getParentNode(), expandFlag, false)
                    }
                    if (expandFlag === node.open && !sonSign) {
                        return null
                    }
                    data.getRoot(setting).expandTriggerFlag = callbackFlag;
                    if (!tools.canAsync(setting, node) && sonSign) {
                        view.expandCollapseSonNode(setting, node, expandFlag, true, function () {
                            if (focus !== false) {
                                try {
                                    $$(node, setting).focus().blur()
                                } catch (e) {}
                            }
                        })
                    } else {
                        node.open = !expandFlag;
                        view.switchNode(this.setting, node);
                        if (focus !== false) {
                            try {
                                $$(node, setting).focus().blur()
                            } catch (e) {}
                        }
                    }
                    return expandFlag
                }, getNodes: function () {
                    return data.getNodes(setting)
                }, getNodeByParam: function (key, value, parentNode) {
                    if (!key) {
                        return null
                    }
                    return data.getNodeByParam(setting, parentNode ? parentNode[setting.data.key.children] : data.getNodes(setting), key, value)
                }, getNodeByTId: function (tId) {
                    return data.getNodeCache(setting, tId)
                }, getNodesByParam: function (key, value, parentNode) {
                    if (!key) {
                        return null
                    }
                    return data.getNodesByParam(setting, parentNode ? parentNode[setting.data.key.children] : data.getNodes(setting), key, value)
                }, getNodesByParamFuzzy: function (key, value, parentNode) {
                    if (!key) {
                        return null
                    }
                    return data.getNodesByParamFuzzy(setting, parentNode ? parentNode[setting.data.key.children] : data.getNodes(setting), key, value)
                }, getNodesByFilter: function (filter, isSingle, parentNode, invokeParam) {
                    isSingle = !!isSingle;
                    if (!filter || (typeof filter != "function")) {
                        return (isSingle ? null : [])
                    }
                    return data.getNodesByFilter(setting, parentNode ? parentNode[setting.data.key.children] : data.getNodes(setting), filter, isSingle, invokeParam)
                }, getNodeIndex: function (node) {
                    if (!node) {
                        return null
                    }
                    var childKey = setting.data.key.children,
                        parentNode = (node.parentTId) ? node.getParentNode() : data.getRoot(setting);
                    for (var i = 0, l = parentNode[childKey].length; i < l; i++) {
                        if (parentNode[childKey][i] == node) {
                            return i
                        }
                    }
                    return -1
                }, getSelectedNodes: function () {
                    var r = [],
                        list = data.getRoot(setting).curSelectedList;
                    for (var i = 0, l = list.length; i < l; i++) {
                        r.push(list[i])
                    }
                    return r
                }, isSelectedNode: function (node) {
                    return data.isSelectedNode(setting, node)
                }, reAsyncChildNodes: function (parentNode, reloadType, isSilent) {
                    if (!this.setting.async.enable) {
                        return
                    }
                    var isRoot = !parentNode;
                    if (isRoot) {
                        parentNode = data.getRoot(setting)
                    }
                    if (reloadType == "refresh") {
                        var childKey = this.setting.data.key.children;
                        for (var i = 0, l = parentNode[childKey] ? parentNode[childKey].length : 0; i < l; i++) {
                            data.removeNodeCache(setting, parentNode[childKey][i])
                        }
                        data.removeSelectedNode(setting);
                        parentNode[childKey] = [];
                        if (isRoot) {
                            this.setting.treeObj.empty()
                        } else {
                            var ulObj = $$(parentNode, consts.id.UL, setting);
                            ulObj.empty()
                        }
                    }
                    view.asyncNode(this.setting, isRoot ? null : parentNode, !!isSilent)
                }, refresh: function () {
                    this.setting.treeObj.empty();
                    var root = data.getRoot(setting),
                        nodes = root[setting.data.key.children];
                    data.initRoot(setting);
                    root[setting.data.key.children] = nodes;
                    data.initCache(setting);
                    view.createNodes(setting, 0, root[setting.data.key.children])
                }, removeChildNodes: function (node) {
                    if (!node) {
                        return null
                    }
                    var childKey = setting.data.key.children,
                        nodes = node[childKey];
                    view.removeChildNodes(setting, node);
                    return nodes ? nodes : null
                }, removeNode: function (node, callbackFlag) {
                    if (!node) {
                        return
                    }
                    callbackFlag = !!callbackFlag;
                    if (callbackFlag && tools.apply(setting.callback.beforeRemove, [setting.treeId, node], true) == false) {
                        return
                    }
                    view.removeNode(setting, node);
                    if (callbackFlag) {
                        this.setting.treeObj.trigger(consts.event.REMOVE, [setting.treeId, node])
                    }
                }, selectNode: function (node, addFlag) {
                    if (!node) {
                        return
                    }
                    if (tools.uCanDo(setting)) {
                        addFlag = setting.view.selectedMulti && addFlag;
                        if (node.parentTId) {
                            view.expandCollapseParentNode(setting, node.getParentNode(), true, false, function () {
                                try {
                                    $$(node, setting).focus().blur()
                                } catch (e) {}
                            })
                        } else {
                            try {
                                $$(node, setting).focus().blur()
                            } catch (e) {}
                        }
                        view.selectNode(setting, node, addFlag)
                    }
                }, transformTozTreeNodes: function (simpleNodes) {
                    return data.transformTozTreeFormat(setting, simpleNodes)
                }, transformToArray: function (nodes) {
                    return data.transformToArrayFormat(setting, nodes)
                }, updateNode: function (node, checkTypeFlag) {
                    if (!node) {
                        return
                    }
                    var nObj = $$(node, setting);
                    if (nObj.get(0) && tools.uCanDo(setting)) {
                        view.setNodeName(setting, node);
                        view.setNodeTarget(setting, node);
                        view.setNodeUrl(setting, node);
                        view.setNodeLineIcos(setting, node);
                        view.setNodeFontCss(setting, node)
                    }
                }
            };
            root.treeTools = zTreeTools;
            data.setZTreeTools(setting, zTreeTools);
            if (root[childKey] && root[childKey].length > 0) {
                view.createNodes(setting, 0, root[childKey])
            } else {
                if (setting.async.enable && setting.async.url && setting.async.url !== "") {
                    view.asyncNode(setting)
                }
            }
            return zTreeTools
        }
    };
    var zt = $.fn.zTree,
        $$ = tools.$,
        consts = zt.consts
})(jQuery);
(function (f) {
    var A = {
            event: {
                CHECK: "ztree_check"
            },
            id: {
                CHECK: "_check"
            },
            checkbox: {
                STYLE: "checkbox",
                DEFAULT: "chk",
                DISABLED: "disable",
                FALSE: "false",
                TRUE: "true",
                FULL: "full",
                PART: "part",
                FOCUS: "focus"
            },
            radio: {
                STYLE: "radio",
                TYPE_ALL: "all",
                TYPE_LEVEL: "level"
            }
        },
        n = {
            check: {
                enable: false,
                autoCheckTrigger: false,
                chkStyle: A.checkbox.STYLE,
                nocheckInherit: false,
                chkDisabledInherit: false,
                radioType: A.radio.TYPE_LEVEL,
                chkboxType: {
                    Y: "ps",
                    N: "ps"
                }
            },
            data: {
                key: {
                    checked: "checked"
                }
            },
            callback: {
                beforeCheck: null,
                onCheck: null
            }
        },
        w = function (B) {
            var C = z.getRoot(B);
            C.radioCheckedList = []
        },
        d = function (B) {},
        o = function (B) {
            var C = B.treeObj,
                D = r.event;
            C.bind(D.CHECK, function (G, F, H, E) {
                u.apply(B.callback.onCheck, [!!F ? F : G, H, E])
            })
        },
        y = function (B) {
            var C = B.treeObj,
                D = r.event;
            C.unbind(D.CHECK)
        },
        p = function (H) {
            var I = H.target,
                K = z.getSetting(H.data.treeId),
                F = "",
                C = null,
                D = "",
                G = "",
                B = null,
                E = null;
            if (u.eqs(H.type, "mouseover")) {
                if (K.check.enable && u.eqs(I.tagName, "span") && I.getAttribute("treeNode" + r.id.CHECK) !== null) {
                    F = u.getNodeMainDom(I).id;
                    D = "mouseoverCheck"
                }
            } else {
                if (u.eqs(H.type, "mouseout")) {
                    if (K.check.enable && u.eqs(I.tagName, "span") && I.getAttribute("treeNode" + r.id.CHECK) !== null) {
                        F = u.getNodeMainDom(I).id;
                        D = "mouseoutCheck"
                    }
                } else {
                    if (u.eqs(H.type, "click")) {
                        if (K.check.enable && u.eqs(I.tagName, "span") && I.getAttribute("treeNode" + r.id.CHECK) !== null) {
                            F = u.getNodeMainDom(I).id;
                            D = "checkNode"
                        }
                    }
                }
            } if (F.length > 0) {
                C = z.getNodeCache(K, F);
                switch (D) {
                    case "checkNode":
                        B = m.onCheckNode;
                        break;
                    case "mouseoverCheck":
                        B = m.onMouseoverCheck;
                        break;
                    case "mouseoutCheck":
                        B = m.onMouseoutCheck;
                        break
                }
            }
            var J = {
                stop: D === "checkNode",
                node: C,
                nodeEventType: D,
                nodeEventCallback: B,
                treeEventType: G,
                treeEventCallback: E
            };
            return J
        },
        v = function (J, D, F, G, I, H, E) {
            if (!F) {
                return
            }
            var C = J.data.key.checked;
            if (typeof F[C] == "string") {
                F[C] = u.eqs(F[C], "true")
            }
            F[C] = !!F[C];
            F.checkedOld = F[C];
            if (typeof F.nocheck == "string") {
                F.nocheck = u.eqs(F.nocheck, "true")
            }
            F.nocheck = !!F.nocheck || (J.check.nocheckInherit && G && !!G.nocheck);
            if (typeof F.chkDisabled == "string") {
                F.chkDisabled = u.eqs(F.chkDisabled, "true")
            }
            F.chkDisabled = !!F.chkDisabled || (J.check.chkDisabledInherit && G && !!G.chkDisabled);
            if (typeof F.halfCheck == "string") {
                F.halfCheck = u.eqs(F.halfCheck, "true")
            }
            F.halfCheck = !!F.halfCheck;
            F.check_Child_State = -1;
            F.check_Focus = false;
            F.getCheckStatus = function () {
                return z.getCheckStatus(J, F)
            };
            if (J.check.chkStyle == r.radio.STYLE && J.check.radioType == r.radio.TYPE_ALL && F[C]) {
                var B = z.getRoot(J);
                B.radioCheckedList.push(F)
            }
        },
        a = function (D, E, C) {
            var B = D.data.key.checked;
            if (D.check.enable) {
                z.makeChkFlag(D, E);
                C.push("<span ID='", E.tId, r.id.CHECK, "' class='", k.makeChkClass(D, E), "' treeNode", r.id.CHECK, (E.nocheck === true ? " style='display:none;'" : ""), "></span>")
            }
        },
        l = function (D, C) {
            C.checkNode = function (I, H, J, G) {
                var E = D.data.key.checked;
                if (I.chkDisabled === true) {
                    return
                }
                if (H !== true && H !== false) {
                    H = !I[E]
                }
                G = !!G;
                if (I[E] === H && !J) {
                    return
                } else {
                    if (G && u.apply(this.setting.callback.beforeCheck, [D.treeId, I], true) == false) {
                        return
                    }
                } if (u.uCanDo(this.setting) && D.check.enable && I.nocheck !== true) {
                    I[E] = H;
                    var F = j(I, r.id.CHECK, D);
                    if (J || D.check.chkStyle === r.radio.STYLE) {
                        k.checkNodeRelation(D, I)
                    }
                    k.setChkClass(D, F, I);
                    k.repairParentChkClassWithSelf(D, I);
                    if (G) {
                        D.treeObj.trigger(r.event.CHECK, [null, D.treeId, I])
                    }
                }
            };
            C.checkAllNodes = function (E) {
                k.repairAllChk(D, !!E)
            };
            C.getCheckedNodes = function (F) {
                var E = D.data.key.children;
                F = (F !== false);
                return z.getTreeCheckedNodes(D, z.getRoot(D)[E], F)
            };
            C.getChangeCheckedNodes = function () {
                var E = D.data.key.children;
                return z.getTreeChangeCheckedNodes(D, z.getRoot(D)[E])
            };
            C.setChkDisabled = function (F, E, G, H) {
                E = !!E;
                G = !!G;
                H = !!H;
                k.repairSonChkDisabled(D, F, E, H);
                k.repairParentChkDisabled(D, F.getParentNode(), E, G)
            };
            var B = C.updateNode;
            C.updateNode = function (G, H) {
                if (B) {
                    B.apply(C, arguments)
                }
                if (!G || !D.check.enable) {
                    return
                }
                var E = j(G, D);
                if (E.get(0) && u.uCanDo(D)) {
                    var F = j(G, r.id.CHECK, D);
                    if (H == true || D.check.chkStyle === r.radio.STYLE) {
                        k.checkNodeRelation(D, G)
                    }
                    k.setChkClass(D, F, G);
                    k.repairParentChkClassWithSelf(D, G)
                }
            }
        },
        q = {
            getRadioCheckedList: function (E) {
                var D = z.getRoot(E).radioCheckedList;
                for (var C = 0, B = D.length; C < B; C++) {
                    if (!z.getNodeCache(E, D[C].tId)) {
                        D.splice(C, 1);
                        C--;
                        B--
                    }
                }
                return D
            }, getCheckStatus: function (C, E) {
                if (!C.check.enable || E.nocheck || E.chkDisabled) {
                    return null
                }
                var B = C.data.key.checked,
                    D = {
                        checked: E[B],
                        half: E.halfCheck ? E.halfCheck : (C.check.chkStyle == r.radio.STYLE ? (E.check_Child_State === 2) : (E[B] ? (E.check_Child_State > -1 && E.check_Child_State < 2) : (E.check_Child_State > 0)))
                    };
                return D
            }, getTreeCheckedNodes: function (J, C, I, F) {
                if (!C) {
                    return []
                }
                var D = J.data.key.children,
                    B = J.data.key.checked,
                    H = (I && J.check.chkStyle == r.radio.STYLE && J.check.radioType == r.radio.TYPE_ALL);
                F = !F ? [] : F;
                for (var G = 0, E = C.length; G < E; G++) {
                    if (C[G].nocheck !== true && C[G].chkDisabled !== true && C[G][B] == I) {
                        F.push(C[G]);
                        if (H) {
                            break
                        }
                    }
                    z.getTreeCheckedNodes(J, C[G][D], I, F);
                    if (H && F.length > 0) {
                        break
                    }
                }
                return F
            }, getTreeChangeCheckedNodes: function (G, D, F) {
                if (!D) {
                    return []
                }
                var H = G.data.key.children,
                    C = G.data.key.checked;
                F = !F ? [] : F;
                for (var E = 0, B = D.length; E < B; E++) {
                    if (D[E].nocheck !== true && D[E].chkDisabled !== true && D[E][C] != D[E].checkedOld) {
                        F.push(D[E])
                    }
                    z.getTreeChangeCheckedNodes(G, D[E][H], F)
                }
                return F
            }, makeChkFlag: function (I, D) {
                if (!D) {
                    return
                }
                var C = I.data.key.children,
                    B = I.data.key.checked,
                    F = -1;
                if (D[C]) {
                    for (var H = 0, E = D[C].length; H < E; H++) {
                        var J = D[C][H];
                        var G = -1;
                        if (I.check.chkStyle == r.radio.STYLE) {
                            if (J.nocheck === true || J.chkDisabled === true) {
                                G = J.check_Child_State
                            } else {
                                if (J.halfCheck === true) {
                                    G = 2
                                } else {
                                    if (J[B]) {
                                        G = 2
                                    } else {
                                        G = J.check_Child_State > 0 ? 2 : 0
                                    }
                                }
                            } if (G == 2) {
                                F = 2;
                                break
                            } else {
                                if (G == 0) {
                                    F = 0
                                }
                            }
                        } else {
                            if (I.check.chkStyle == r.checkbox.STYLE) {
                                if (J.nocheck === true || J.chkDisabled === true) {
                                    G = J.check_Child_State
                                } else {
                                    if (J.halfCheck === true) {
                                        G = 1
                                    } else {
                                        if (J[B]) {
                                            G = (J.check_Child_State === -1 || J.check_Child_State === 2) ? 2 : 1
                                        } else {
                                            G = (J.check_Child_State > 0) ? 1 : 0
                                        }
                                    }
                                } if (G === 1) {
                                    F = 1;
                                    break
                                } else {
                                    if (G === 2 && F > -1 && H > 0 && G !== F) {
                                        F = 1;
                                        break
                                    } else {
                                        if (F === 2 && G > -1 && G < 2) {
                                            F = 1;
                                            break
                                        } else {
                                            if (G > -1) {
                                                F = G
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                D.check_Child_State = F
            }
        },
        h = {},
        m = {
            onCheckNode: function (F, E) {
                if (E.chkDisabled === true) {
                    return false
                }
                var D = z.getSetting(F.data.treeId),
                    B = D.data.key.checked;
                if (u.apply(D.callback.beforeCheck, [D.treeId, E], true) == false) {
                    return true
                }
                E[B] = !E[B];
                k.checkNodeRelation(D, E);
                var C = j(E, r.id.CHECK, D);
                k.setChkClass(D, C, E);
                k.repairParentChkClassWithSelf(D, E);
                D.treeObj.trigger(r.event.CHECK, [F, D.treeId, E]);
                return true
            }, onMouseoverCheck: function (E, D) {
                if (D.chkDisabled === true) {
                    return false
                }
                var C = z.getSetting(E.data.treeId),
                    B = j(D, r.id.CHECK, C);
                D.check_Focus = true;
                k.setChkClass(C, B, D);
                return true
            }, onMouseoutCheck: function (E, D) {
                if (D.chkDisabled === true) {
                    return false
                }
                var C = z.getSetting(E.data.treeId),
                    B = j(D, r.id.CHECK, C);
                D.check_Focus = false;
                k.setChkClass(C, B, D);
                return true
            }
        },
        i = {},
        e = {
            checkNodeRelation: function (K, E) {
                var I, G, F, D = K.data.key.children,
                    C = K.data.key.checked,
                    B = r.radio;
                if (K.check.chkStyle == B.STYLE) {
                    var J = z.getRadioCheckedList(K);
                    if (E[C]) {
                        if (K.check.radioType == B.TYPE_ALL) {
                            for (G = J.length - 1; G >= 0; G--) {
                                I = J[G];
                                I[C] = false;
                                J.splice(G, 1);
                                k.setChkClass(K, j(I, r.id.CHECK, K), I);
                                if (I.parentTId != E.parentTId) {
                                    k.repairParentChkClassWithSelf(K, I)
                                }
                            }
                            J.push(E)
                        } else {
                            var H = (E.parentTId) ? E.getParentNode() : z.getRoot(K);
                            for (G = 0, F = H[D].length; G < F; G++) {
                                I = H[D][G];
                                if (I[C] && I != E) {
                                    I[C] = false;
                                    k.setChkClass(K, j(I, r.id.CHECK, K), I)
                                }
                            }
                        }
                    } else {
                        if (K.check.radioType == B.TYPE_ALL) {
                            for (G = 0, F = J.length; G < F; G++) {
                                if (E == J[G]) {
                                    J.splice(G, 1);
                                    break
                                }
                            }
                        }
                    }
                } else {
                    if (E[C] && (!E[D] || E[D].length == 0 || K.check.chkboxType.Y.indexOf("s") > -1)) {
                        k.setSonNodeCheckBox(K, E, true)
                    }
                    if (!E[C] && (!E[D] || E[D].length == 0 || K.check.chkboxType.N.indexOf("s") > -1)) {
                        k.setSonNodeCheckBox(K, E, false)
                    }
                    if (E[C] && K.check.chkboxType.Y.indexOf("p") > -1) {
                        k.setParentNodeCheckBox(K, E, true)
                    }
                    if (!E[C] && K.check.chkboxType.N.indexOf("p") > -1) {
                        k.setParentNodeCheckBox(K, E, false)
                    }
                }
            }, makeChkClass: function (C, F) {
                var B = C.data.key.checked,
                    H = r.checkbox,
                    E = r.radio,
                    G = "";
                if (F.chkDisabled === true) {
                    G = H.DISABLED
                } else {
                    if (F.halfCheck) {
                        G = H.PART
                    } else {
                        if (C.check.chkStyle == E.STYLE) {
                            G = (F.check_Child_State < 1) ? H.FULL : H.PART
                        } else {
                            G = F[B] ? ((F.check_Child_State === 2 || F.check_Child_State === -1) ? H.FULL : H.PART) : ((F.check_Child_State < 1) ? H.FULL : H.PART)
                        }
                    }
                }
                var D = C.check.chkStyle + "_" + (F[B] ? H.TRUE : H.FALSE) + "_" + G;
                D = (F.check_Focus && F.chkDisabled !== true) ? D + "_" + H.FOCUS : D;
                return r.className.BUTTON + " " + H.DEFAULT + " " + D
            }, repairAllChk: function (F, I) {
                if (F.check.enable && F.check.chkStyle === r.checkbox.STYLE) {
                    var D = F.data.key.checked,
                        H = F.data.key.children,
                        C = z.getRoot(F);
                    for (var E = 0, B = C[H].length; E < B; E++) {
                        var G = C[H][E];
                        if (G.nocheck !== true && G.chkDisabled !== true) {
                            G[D] = I
                        }
                        k.setSonNodeCheckBox(F, G, I)
                    }
                }
            }, repairChkClass: function (C, D) {
                if (!D) {
                    return
                }
                z.makeChkFlag(C, D);
                if (D.nocheck !== true) {
                    var B = j(D, r.id.CHECK, C);
                    k.setChkClass(C, B, D)
                }
            }, repairParentChkClass: function (C, D) {
                if (!D || !D.parentTId) {
                    return
                }
                var B = D.getParentNode();
                k.repairChkClass(C, B);
                k.repairParentChkClass(C, B)
            }, repairParentChkClassWithSelf: function (B, D) {
                if (!D) {
                    return
                }
                var C = B.data.key.children;
                if (D[C] && D[C].length > 0) {
                    k.repairParentChkClass(B, D[C][0])
                } else {
                    k.repairParentChkClass(B, D)
                }
            }, repairSonChkDisabled: function (G, I, F, D) {
                if (!I) {
                    return
                }
                var H = G.data.key.children;
                if (I.chkDisabled != F) {
                    I.chkDisabled = F
                }
                k.repairChkClass(G, I);
                if (I[H] && D) {
                    for (var E = 0, C = I[H].length; E < C; E++) {
                        var B = I[H][E];
                        k.repairSonChkDisabled(G, B, F, D)
                    }
                }
            }, repairParentChkDisabled: function (D, E, C, B) {
                if (!E) {
                    return
                }
                if (E.chkDisabled != C && B) {
                    E.chkDisabled = C
                }
                k.repairChkClass(D, E);
                k.repairParentChkDisabled(D, E.getParentNode(), C, B)
            }, setChkClass: function (B, D, C) {
                if (!D) {
                    return
                }
                if (C.nocheck === true) {
                    D.hide()
                } else {
                    D.show()
                }
                D.removeClass();
                D.addClass(k.makeChkClass(B, C))
            }, setParentNodeCheckBox: function (L, E, K, H) {
                var D = L.data.key.children,
                    B = L.data.key.checked,
                    I = j(E, r.id.CHECK, L);
                if (!H) {
                    H = E
                }
                z.makeChkFlag(L, E);
                if (E.nocheck !== true && E.chkDisabled !== true) {
                    E[B] = K;
                    k.setChkClass(L, I, E);
                    if (L.check.autoCheckTrigger && E != H) {
                        L.treeObj.trigger(r.event.CHECK, [null, L.treeId, E])
                    }
                }
                if (E.parentTId) {
                    var J = true;
                    if (!K) {
                        var C = E.getParentNode()[D];
                        for (var G = 0, F = C.length; G < F; G++) {
                            if ((C[G].nocheck !== true && C[G].chkDisabled !== true && C[G][B]) || ((C[G].nocheck === true || C[G].chkDisabled === true) && C[G].check_Child_State > 0)) {
                                J = false;
                                break
                            }
                        }
                    }
                    if (J) {
                        k.setParentNodeCheckBox(L, E.getParentNode(), K, H)
                    }
                }
            }, setSonNodeCheckBox: function (L, E, K, H) {
                if (!E) {
                    return
                }
                var D = L.data.key.children,
                    B = L.data.key.checked,
                    I = j(E, r.id.CHECK, L);
                if (!H) {
                    H = E
                }
                var C = false;
                if (E[D]) {
                    for (var G = 0, F = E[D].length; G < F && E.chkDisabled !== true; G++) {
                        var J = E[D][G];
                        k.setSonNodeCheckBox(L, J, K, H);
                        if (J.chkDisabled === true) {
                            C = true
                        }
                    }
                }
                if (E != z.getRoot(L) && E.chkDisabled !== true) {
                    if (C && E.nocheck !== true) {
                        z.makeChkFlag(L, E)
                    }
                    if (E.nocheck !== true && E.chkDisabled !== true) {
                        E[B] = K;
                        if (!C) {
                            E.check_Child_State = (E[D] && E[D].length > 0) ? (K ? 2 : 0) : -1
                        }
                    } else {
                        E.check_Child_State = -1
                    }
                    k.setChkClass(L, I, E);
                    if (L.check.autoCheckTrigger && E != H && E.nocheck !== true && E.chkDisabled !== true) {
                        L.treeObj.trigger(r.event.CHECK, [null, L.treeId, E])
                    }
                }
            }
        },
        t = {
            tools: i,
            view: e,
            event: h,
            data: q
        };
    f.extend(true, f.fn.zTree.consts, A);
    f.extend(true, f.fn.zTree._z, t);
    var c = f.fn.zTree,
        u = c._z.tools,
        r = c.consts,
        k = c._z.view,
        z = c._z.data,
        s = c._z.event,
        j = u.$;
    z.exSetting(n);
    z.addInitBind(o);
    z.addInitUnBind(y);
    z.addInitCache(d);
    z.addInitNode(v);
    z.addInitProxy(p, true);
    z.addInitRoot(w);
    z.addBeforeA(a);
    z.addZTreeTools(l);
    var x = k.createNodes;
    k.createNodes = function (D, E, C, B) {
        if (x) {
            x.apply(k, arguments)
        }
        if (!C) {
            return
        }
        k.repairParentChkClassWithSelf(D, B)
    };
    var b = k.removeNode;
    k.removeNode = function (C, D) {
        var B = D.getParentNode();
        if (b) {
            b.apply(k, arguments)
        }
        if (!D || !B) {
            return
        }
        k.repairChkClass(C, B);
        k.repairParentChkClass(C, B)
    };
    var g = k.appendNodes;
    k.appendNodes = function (F, H, C, B, E, G) {
        var D = "";
        if (g) {
            D = g.apply(k, arguments)
        }
        if (B) {
            z.makeChkFlag(F, B)
        }
        return D
    }
})(jQuery);
(function (f) {
    var C = {
            event: {
                DRAG: "ztree_drag",
                DROP: "ztree_drop",
                REMOVE: "ztree_remove",
                RENAME: "ztree_rename"
            },
            id: {
                EDIT: "_edit",
                INPUT: "_input",
                REMOVE: "_remove"
            },
            move: {
                TYPE_INNER: "inner",
                TYPE_PREV: "prev",
                TYPE_NEXT: "next"
            },
            node: {
                CURSELECTED_EDIT: "curSelectedNode_Edit",
                TMPTARGET_TREE: "tmpTargetzTree",
                TMPTARGET_NODE: "tmpTargetNode"
            }
        },
        m = {
            edit: {
                enable: false,
                editNameSelectAll: false,
                showRemoveBtn: true,
                showRenameBtn: true,
                removeTitle: "remove",
                renameTitle: "rename",
                drag: {
                    autoExpandTrigger: false,
                    isCopy: true,
                    isMove: true,
                    prev: true,
                    next: true,
                    inner: true,
                    minMoveSize: 5,
                    borderMax: 10,
                    borderMin: -5,
                    maxShowNodeNum: 5,
                    autoOpenTime: 500
                }
            },
            view: {
                addHoverDom: null,
                removeHoverDom: null
            },
            callback: {
                beforeDrag: null,
                beforeDragOpen: null,
                beforeDrop: null,
                beforeEditName: null,
                beforeRename: null,
                onDrag: null,
                onDrop: null,
                onRename: null
            }
        },
        x = function (E) {
            var F = A.getRoot(E),
                D = A.getRoots();
            F.curEditNode = null;
            F.curEditInput = null;
            F.curHoverNode = null;
            F.dragFlag = 0;
            F.dragNodeShowBefore = [];
            F.dragMaskList = new Array();
            D.showHoverDom = true
        },
        c = function (D) {},
        n = function (D) {
            var E = D.treeObj;
            var F = q.event;
            E.bind(F.RENAME, function (H, J, I, G) {
                v.apply(D.callback.onRename, [H, J, I, G])
            });
            E.bind(F.REMOVE, function (G, I, H) {
                v.apply(D.callback.onRemove, [G, I, H])
            });
            E.bind(F.DRAG, function (H, G, J, I) {
                v.apply(D.callback.onDrag, [G, J, I])
            });
            E.bind(F.DROP, function (J, I, L, K, M, H, G) {
                v.apply(D.callback.onDrop, [I, L, K, M, H, G])
            })
        },
        z = function (D) {
            var E = D.treeObj;
            var F = q.event;
            E.unbind(F.RENAME);
            E.unbind(F.REMOVE);
            E.unbind(F.DRAG);
            E.unbind(F.DROP)
        },
        o = function (K) {
            var L = K.target,
                O = A.getSetting(K.data.treeId),
                M = K.relatedTarget,
                I = "",
                E = null,
                F = "",
                J = "",
                D = null,
                H = null,
                G = null;
            if (v.eqs(K.type, "mouseover")) {
                G = v.getMDom(O, L, [{
                    tagName: "a",
                    attrName: "treeNode" + q.id.A
                }]);
                if (G) {
                    I = v.getNodeMainDom(G).id;
                    F = "hoverOverNode"
                }
            } else {
                if (v.eqs(K.type, "mouseout")) {
                    G = v.getMDom(O, M, [{
                        tagName: "a",
                        attrName: "treeNode" + q.id.A
                    }]);
                    if (!G) {
                        I = "remove";
                        F = "hoverOutNode"
                    }
                } else {
                    if (v.eqs(K.type, "mousedown")) {
                        G = v.getMDom(O, L, [{
                            tagName: "a",
                            attrName: "treeNode" + q.id.A
                        }]);
                        if (G) {
                            I = v.getNodeMainDom(G).id;
                            F = "mousedownNode"
                        }
                    }
                }
            } if (I.length > 0) {
                E = A.getNodeCache(O, I);
                switch (F) {
                    case "mousedownNode":
                        D = l.onMousedownNode;
                        break;
                    case "hoverOverNode":
                        D = l.onHoverOverNode;
                        break;
                    case "hoverOutNode":
                        D = l.onHoverOutNode;
                        break
                }
            }
            var N = {
                stop: false,
                node: E,
                nodeEventType: F,
                nodeEventCallback: D,
                treeEventType: J,
                treeEventCallback: H
            };
            return N
        },
        w = function (F, J, I, D, H, E, G) {
            if (!I) {
                return
            }
            I.isHover = false;
            I.editNameFlag = false
        },
        k = function (E, D) {
            D.cancelEditName = function (G) {
                var F = A.getRoot(E),
                    H = E.data.key.name,
                    I = F.curEditNode;
                if (!F.curEditNode) {
                    return
                }
                j.cancelCurEditNode(E, G ? G : I[H])
            };
            D.copyNode = function (J, I, H, K) {
                if (!I) {
                    return null
                }
                if (J && !J.isParent && E.data.keep.leaf && H === q.move.TYPE_INNER) {
                    return null
                }
                var F = v.clone(I);
                if (!J) {
                    J = null;
                    H = q.move.TYPE_INNER
                }
                if (H == q.move.TYPE_INNER) {
                    function G() {
                        j.addNodes(E, J, [F], K)
                    }
                    if (v.canAsync(E, J)) {
                        j.asyncNode(E, J, K, G)
                    } else {
                        G()
                    }
                } else {
                    j.addNodes(E, J.parentNode, [F], K);
                    j.moveNode(E, J, F, H, false, K)
                }
                return F
            };
            D.editName = function (F) {
                if (!F || !F.tId || F !== A.getNodeCache(E, F.tId)) {
                    return
                }
                if (F.parentTId) {
                    j.expandCollapseParentNode(E, F.getParentNode(), true)
                }
                j.editNode(E, F)
            };
            D.moveNode = function (H, G, F, J) {
                if (!G) {
                    return G
                }
                if (H && !H.isParent && E.data.keep.leaf && F === q.move.TYPE_INNER) {
                    return null
                } else {
                    if (H && ((G.parentTId == H.tId && F == q.move.TYPE_INNER) || i(G, E).find("#" + H.tId).length > 0)) {
                        return null
                    } else {
                        if (!H) {
                            H = null
                        }
                    }
                }

                function I() {
                    j.moveNode(E, H, G, F, false, J)
                }
                if (v.canAsync(E, H) && F === q.move.TYPE_INNER) {
                    j.asyncNode(E, H, J, I)
                } else {
                    I()
                }
                return G
            };
            D.setEditable = function (F) {
                E.edit.enable = F;
                return this.refresh()
            }
        },
        p = {
            setSonNodeLevel: function (G, D, I) {
                if (!I) {
                    return
                }
                var H = G.data.key.children;
                I.level = (D) ? D.level + 1 : 0;
                if (!I[H]) {
                    return
                }
                for (var F = 0, E = I[H].length; F < E; F++) {
                    if (I[H][F]) {
                        A.setSonNodeLevel(G, I, I[H][F])
                    }
                }
            }
        },
        g = {},
        l = {
            onHoverOverNode: function (G, F) {
                var E = A.getSetting(G.data.treeId),
                    D = A.getRoot(E);
                if (D.curHoverNode != F) {
                    l.onHoverOutNode(G)
                }
                D.curHoverNode = F;
                j.addHoverDom(E, F)
            }, onHoverOutNode: function (G, F) {
                var E = A.getSetting(G.data.treeId),
                    D = A.getRoot(E);
                if (D.curHoverNode && !A.isSelectedNode(E, D.curHoverNode)) {
                    j.removeTreeDom(E, D.curHoverNode);
                    D.curHoverNode = null
                }
            }, onMousedownNode: function (S, K) {
                var aa, X, R = A.getSetting(S.data.treeId),
                    W = A.getRoot(R),
                    L = A.getRoots();
                if (S.button == 2 || !R.edit.enable || (!R.edit.drag.isCopy && !R.edit.drag.isMove)) {
                    return true
                }
                var ad = S.target,
                    J = A.getRoot(R).curSelectedList,
                    T = [];
                if (!A.isSelectedNode(R, K)) {
                    T = [K]
                } else {
                    for (aa = 0, X = J.length; aa < X; aa++) {
                        if (J[aa].editNameFlag && v.eqs(ad.tagName, "input") && ad.getAttribute("treeNode" + q.id.INPUT) !== null) {
                            return true
                        }
                        T.push(J[aa]);
                        if (T[0].parentTId !== J[aa].parentTId) {
                            T = [K];
                            break
                        }
                    }
                }
                j.editNodeBlur = true;
                j.cancelCurEditNode(R);
                var ag = f(R.treeObj.get(0).ownerDocument),
                    M = f(R.treeObj.get(0).ownerDocument.body),
                    Z, N, ab, ac = false,
                    ae = R,
                    I = R,
                    D, H, U = null,
                    G = null,
                    Q = null,
                    E = q.move.TYPE_INNER,
                    Y = S.clientX,
                    V = S.clientY,
                    O = (new Date()).getTime();
                if (v.uCanDo(R)) {
                    ag.bind("mousemove", P)
                }

                function P(a5) {
                    if (W.dragFlag == 0 && Math.abs(Y - a5.clientX) < R.edit.drag.minMoveSize && Math.abs(V - a5.clientY) < R.edit.drag.minMoveSize) {
                        return true
                    }
                    var a0, aW, ay, aR, aJ, aQ = R.data.key.children;
                    M.css("cursor", "pointer");
                    if (W.dragFlag == 0) {
                        if (v.apply(R.callback.beforeDrag, [R.treeId, T], true) == false) {
                            af(a5);
                            return true
                        }
                        for (a0 = 0, aW = T.length; a0 < aW; a0++) {
                            if (a0 == 0) {
                                W.dragNodeShowBefore = []
                            }
                            ay = T[a0];
                            if (ay.isParent && ay.open) {
                                j.expandCollapseNode(R, ay, !ay.open);
                                W.dragNodeShowBefore[ay.tId] = true
                            } else {
                                W.dragNodeShowBefore[ay.tId] = false
                            }
                        }
                        W.dragFlag = 1;
                        L.showHoverDom = false;
                        v.showIfameMask(R, true);
                        var ai = true,
                            al = -1;
                        if (T.length > 1) {
                            var aw = T[0].parentTId ? T[0].getParentNode()[aQ] : A.getNodes(R);
                            aJ = [];
                            for (a0 = 0, aW = aw.length; a0 < aW; a0++) {
                                if (W.dragNodeShowBefore[aw[a0].tId] !== undefined) {
                                    if (ai && al > -1 && (al + 1) !== a0) {
                                        ai = false
                                    }
                                    aJ.push(aw[a0]);
                                    al = a0
                                }
                                if (T.length === aJ.length) {
                                    T = aJ;
                                    break
                                }
                            }
                        }
                        if (ai) {
                            D = T[0].getPreNode();
                            H = T[T.length - 1].getNextNode()
                        }
                        Z = i("<ul class='zTreeDragUL'></ul>", R);
                        for (a0 = 0, aW = T.length; a0 < aW; a0++) {
                            ay = T[a0];
                            ay.editNameFlag = false;
                            j.selectNode(R, ay, a0 > 0);
                            j.removeTreeDom(R, ay);
                            aR = i("<li id='" + ay.tId + "_tmp'></li>", R);
                            aR.append(i(ay, q.id.A, R).clone());
                            aR.css("padding", "0");
                            aR.children("#" + ay.tId + q.id.A).removeClass(q.node.CURSELECTED);
                            Z.append(aR);
                            if (a0 == R.edit.drag.maxShowNodeNum - 1) {
                                aR = i("<li id='" + ay.tId + "_moretmp'><a>  ...  </a></li>", R);
                                Z.append(aR);
                                break
                            }
                        }
                        Z.attr("id", T[0].tId + q.id.UL + "_tmp");
                        Z.addClass(R.treeObj.attr("class"));
                        Z.appendTo(M);
                        N = i("<span class='tmpzTreeMove_arrow'></span>", R);
                        N.attr("id", "zTreeMove_arrow_tmp");
                        N.appendTo(M);
                        R.treeObj.trigger(q.event.DRAG, [a5, R.treeId, T])
                    }
                    if (W.dragFlag == 1) {
                        if (ab && N.attr("id") == a5.target.id && Q && (a5.clientX + ag.scrollLeft() + 2) > (f("#" + Q + q.id.A, ab).offset().left)) {
                            var a4 = f("#" + Q + q.id.A, ab);
                            a5.target = (a4.length > 0) ? a4.get(0) : a5.target
                        } else {
                            if (ab) {
                                ab.removeClass(q.node.TMPTARGET_TREE);
                                if (Q) {
                                    f("#" + Q + q.id.A, ab).removeClass(q.node.TMPTARGET_NODE + "_" + q.move.TYPE_PREV).removeClass(q.node.TMPTARGET_NODE + "_" + C.move.TYPE_NEXT).removeClass(q.node.TMPTARGET_NODE + "_" + C.move.TYPE_INNER)
                                }
                            }
                        }
                        ab = null;
                        Q = null;
                        ac = false;
                        ae = R;
                        var a1 = A.getSettings();
                        for (var aS in a1) {
                            if (a1[aS].treeId && a1[aS].edit.enable && a1[aS].treeId != R.treeId && (a5.target.id == a1[aS].treeId || f(a5.target).parents("#" + a1[aS].treeId).length > 0)) {
                                ac = true;
                                ae = a1[aS]
                            }
                        }
                        var av = ag.scrollTop(),
                            a3 = ag.scrollLeft(),
                            aj = ae.treeObj.offset(),
                            aD = ae.treeObj.get(0).scrollHeight,
                            aT = ae.treeObj.get(0).scrollWidth,
                            a2 = (a5.clientY + av - aj.top),
                            aP = (ae.treeObj.height() + aj.top - a5.clientY - av),
                            aK = (a5.clientX + a3 - aj.left),
                            au = (ae.treeObj.width() + aj.left - a5.clientX - a3),
                            ax = (a2 < R.edit.drag.borderMax && a2 > R.edit.drag.borderMin),
                            a6 = (aP < R.edit.drag.borderMax && aP > R.edit.drag.borderMin),
                            aN = (aK < R.edit.drag.borderMax && aK > R.edit.drag.borderMin),
                            ar = (au < R.edit.drag.borderMax && au > R.edit.drag.borderMin),
                            ak = a2 > R.edit.drag.borderMin && aP > R.edit.drag.borderMin && aK > R.edit.drag.borderMin && au > R.edit.drag.borderMin,
                            aH = (ax && ae.treeObj.scrollTop() <= 0),
                            aG = (a6 && (ae.treeObj.scrollTop() + ae.treeObj.height() + 10) >= aD),
                            an = (aN && ae.treeObj.scrollLeft() <= 0),
                            aB = (ar && (ae.treeObj.scrollLeft() + ae.treeObj.width() + 10) >= aT);
                        if (a5.target.id && ae.treeObj.find("#" + a5.target.id).length > 0) {
                            var at = a5.target;
                            while (at && at.tagName && !v.eqs(at.tagName, "li") && at.id != ae.treeId) {
                                at = at.parentNode
                            }
                            var aA = true;
                            for (a0 = 0, aW = T.length; a0 < aW; a0++) {
                                ay = T[a0];
                                if (at.id === ay.tId) {
                                    aA = false;
                                    break
                                } else {
                                    if (i(ay, R).find("#" + at.id).length > 0) {
                                        aA = false;
                                        break
                                    }
                                }
                            }
                            if (aA) {
                                if (a5.target.id && (a5.target.id == (at.id + q.id.A) || f(a5.target).parents("#" + at.id + q.id.A).length > 0)) {
                                    ab = f(at);
                                    Q = at.id
                                }
                            }
                        }
                        ay = T[0];
                        if (ak && (a5.target.id == ae.treeId || f(a5.target).parents("#" + ae.treeId).length > 0)) {
                            if (!ab && (a5.target.id == ae.treeId || aH || aG || an || aB) && (ac || (!ac && ay.parentTId))) {
                                ab = ae.treeObj
                            }
                            if (ax) {
                                ae.treeObj.scrollTop(ae.treeObj.scrollTop() - 10)
                            } else {
                                if (a6) {
                                    ae.treeObj.scrollTop(ae.treeObj.scrollTop() + 10)
                                }
                            } if (aN) {
                                ae.treeObj.scrollLeft(ae.treeObj.scrollLeft() - 10)
                            } else {
                                if (ar) {
                                    ae.treeObj.scrollLeft(ae.treeObj.scrollLeft() + 10)
                                }
                            } if (ab && ab != ae.treeObj && ab.offset().left < ae.treeObj.offset().left) {
                                ae.treeObj.scrollLeft(ae.treeObj.scrollLeft() + ab.offset().left - ae.treeObj.offset().left)
                            }
                        }
                        Z.css({
                            top: (a5.clientY + av + 3) + "px",
                            left: (a5.clientX + a3 + 3) + "px"
                        });
                        var aF = 0;
                        var aE = 0;
                        if (ab && ab.attr("id") != ae.treeId) {
                            var aO = Q == null ? null : A.getNodeCache(ae, Q),
                                aI = (a5.ctrlKey && R.edit.drag.isMove && R.edit.drag.isCopy) || (!R.edit.drag.isMove && R.edit.drag.isCopy),
                                ap = !!(D && Q === D.tId),
                                aM = !!(H && Q === H.tId),
                                aY = (ay.parentTId && ay.parentTId == Q),
                                aL = (aI || !aM) && v.apply(ae.edit.drag.prev, [ae.treeId, T, aO], !!ae.edit.drag.prev),
                                ao = (aI || !ap) && v.apply(ae.edit.drag.next, [ae.treeId, T, aO], !!ae.edit.drag.next),
                                ah = (aI || !aY) && !(ae.data.keep.leaf && !aO.isParent) && v.apply(ae.edit.drag.inner, [ae.treeId, T, aO], !!ae.edit.drag.inner);
                            if (!aL && !ao && !ah) {
                                ab = null;
                                Q = "";
                                E = q.move.TYPE_INNER;
                                N.css({
                                    display: "none"
                                });
                                if (window.zTreeMoveTimer) {
                                    clearTimeout(window.zTreeMoveTimer);
                                    window.zTreeMoveTargetNodeTId = null
                                }
                            } else {
                                var aC = f("#" + Q + q.id.A, ab),
                                    aV = aO.isLastNode ? null : f("#" + aO.getNextNode().tId + q.id.A, ab.next()),
                                    aX = aC.offset().top,
                                    aZ = aC.offset().left,
                                    aU = aL ? (ah ? 0.25 : (ao ? 0.5 : 1)) : -1,
                                    aq = ao ? (ah ? 0.75 : (aL ? 0.5 : 0)) : -1,
                                    am = (a5.clientY + av - aX) / aC.height();
                                if ((aU == 1 || am <= aU && am >= -0.2) && aL) {
                                    aF = 1 - N.width();
                                    aE = aX - N.height() / 2;
                                    E = q.move.TYPE_PREV
                                } else {
                                    if ((aq == 0 || am >= aq && am <= 1.2) && ao) {
                                        aF = 1 - N.width();
                                        aE = (aV == null || (aO.isParent && aO.open)) ? (aX + aC.height() - N.height() / 2) : (aV.offset().top - N.height() / 2);
                                        E = q.move.TYPE_NEXT
                                    } else {
                                        aF = 5 - N.width();
                                        aE = aX;
                                        E = q.move.TYPE_INNER
                                    }
                                }
                                N.css({
                                    display: "block",
                                    top: aE + "px",
                                    left: (aZ + aF) + "px"
                                });
                                aC.addClass(q.node.TMPTARGET_NODE + "_" + E);
                                if (U != Q || G != E) {
                                    O = (new Date()).getTime()
                                }
                                if (aO && aO.isParent && E == q.move.TYPE_INNER) {
                                    var az = true;
                                    if (window.zTreeMoveTimer && window.zTreeMoveTargetNodeTId !== aO.tId) {
                                        clearTimeout(window.zTreeMoveTimer);
                                        window.zTreeMoveTargetNodeTId = null
                                    } else {
                                        if (window.zTreeMoveTimer && window.zTreeMoveTargetNodeTId === aO.tId) {
                                            az = false
                                        }
                                    } if (az) {
                                        window.zTreeMoveTimer = setTimeout(function () {
                                            if (E != q.move.TYPE_INNER) {
                                                return
                                            }
                                            if (aO && aO.isParent && !aO.open && (new Date()).getTime() - O > ae.edit.drag.autoOpenTime && v.apply(ae.callback.beforeDragOpen, [ae.treeId, aO], true)) {
                                                j.switchNode(ae, aO);
                                                if (ae.edit.drag.autoExpandTrigger) {
                                                    ae.treeObj.trigger(q.event.EXPAND, [ae.treeId, aO])
                                                }
                                            }
                                        }, ae.edit.drag.autoOpenTime + 50);
                                        window.zTreeMoveTargetNodeTId = aO.tId
                                    }
                                }
                            }
                        } else {
                            E = q.move.TYPE_INNER;
                            if (ab && v.apply(ae.edit.drag.inner, [ae.treeId, T, null], !!ae.edit.drag.inner)) {
                                ab.addClass(q.node.TMPTARGET_TREE)
                            } else {
                                ab = null
                            }
                            N.css({
                                display: "none"
                            });
                            if (window.zTreeMoveTimer) {
                                clearTimeout(window.zTreeMoveTimer);
                                window.zTreeMoveTargetNodeTId = null
                            }
                        }
                        U = Q;
                        G = E
                    }
                    return false
                }
                ag.bind("mouseup", af);

                function af(ao) {
                    if (window.zTreeMoveTimer) {
                        clearTimeout(window.zTreeMoveTimer);
                        window.zTreeMoveTargetNodeTId = null
                    }
                    U = null;
                    G = null;
                    ag.unbind("mousemove", P);
                    ag.unbind("mouseup", af);
                    ag.unbind("selectstart", F);
                    M.css("cursor", "auto");
                    if (ab) {
                        ab.removeClass(q.node.TMPTARGET_TREE);
                        if (Q) {
                            f("#" + Q + q.id.A, ab).removeClass(q.node.TMPTARGET_NODE + "_" + q.move.TYPE_PREV).removeClass(q.node.TMPTARGET_NODE + "_" + C.move.TYPE_NEXT).removeClass(q.node.TMPTARGET_NODE + "_" + C.move.TYPE_INNER)
                        }
                    }
                    v.showIfameMask(R, false);
                    L.showHoverDom = true;
                    if (W.dragFlag == 0) {
                        return
                    }
                    W.dragFlag = 0;
                    var am, ai, an;
                    for (am = 0, ai = T.length; am < ai; am++) {
                        an = T[am];
                        if (an.isParent && W.dragNodeShowBefore[an.tId] && !an.open) {
                            j.expandCollapseNode(R, an, !an.open);
                            delete W.dragNodeShowBefore[an.tId]
                        }
                    }
                    if (Z) {
                        Z.remove()
                    }
                    if (N) {
                        N.remove()
                    }
                    var ah = (ao.ctrlKey && R.edit.drag.isMove && R.edit.drag.isCopy) || (!R.edit.drag.isMove && R.edit.drag.isCopy);
                    if (!ah && ab && Q && T[0].parentTId && Q == T[0].parentTId && E == q.move.TYPE_INNER) {
                        ab = null
                    }
                    if (ab) {
                        var aj = Q == null ? null : A.getNodeCache(ae, Q);
                        if (v.apply(R.callback.beforeDrop, [ae.treeId, T, aj, E, ah], true) == false) {
                            j.selectNodes(I, T);
                            return
                        }
                        var ak = ah ? v.clone(T) : T;

                        function al() {
                            if (ac) {
                                if (!ah) {
                                    for (var aq = 0, ap = T.length; aq < ap; aq++) {
                                        j.removeNode(R, T[aq])
                                    }
                                }
                                if (E == q.move.TYPE_INNER) {
                                    j.addNodes(ae, aj, ak)
                                } else {
                                    j.addNodes(ae, aj.getParentNode(), ak);
                                    if (E == q.move.TYPE_PREV) {
                                        for (aq = 0, ap = ak.length; aq < ap; aq++) {
                                            j.moveNode(ae, aj, ak[aq], E, false)
                                        }
                                    } else {
                                        for (aq = -1, ap = ak.length - 1; aq < ap; ap--) {
                                            j.moveNode(ae, aj, ak[ap], E, false)
                                        }
                                    }
                                }
                            } else {
                                if (ah && E == q.move.TYPE_INNER) {
                                    j.addNodes(ae, aj, ak)
                                } else {
                                    if (ah) {
                                        j.addNodes(ae, aj.getParentNode(), ak)
                                    }
                                    if (E != q.move.TYPE_NEXT) {
                                        for (aq = 0, ap = ak.length; aq < ap; aq++) {
                                            j.moveNode(ae, aj, ak[aq], E, false)
                                        }
                                    } else {
                                        for (aq = -1, ap = ak.length - 1; aq < ap; ap--) {
                                            j.moveNode(ae, aj, ak[ap], E, false)
                                        }
                                    }
                                }
                            }
                            j.selectNodes(ae, ak);
                            i(ak[0], R).focus().blur();
                            R.treeObj.trigger(q.event.DROP, [ao, ae.treeId, ak, aj, E, ah])
                        }
                        if (E == q.move.TYPE_INNER && v.canAsync(ae, aj)) {
                            j.asyncNode(ae, aj, false, al)
                        } else {
                            al()
                        }
                    } else {
                        j.selectNodes(I, T);
                        R.treeObj.trigger(q.event.DROP, [ao, R.treeId, T, null, null, null])
                    }
                }
                ag.bind("selectstart", F);

                function F() {
                    return false
                }
                if (S.preventDefault) {
                    S.preventDefault()
                }
                return true
            }
        },
        h = {
            getAbs: function (E) {
                var G = E.getBoundingClientRect(),
                    D = document.body.scrollTop + document.documentElement.scrollTop,
                    F = document.body.scrollLeft + document.documentElement.scrollLeft;
                return [G.left + F, G.top + D]
            }, inputFocus: function (D) {
                if (D.get(0)) {
                    D.focus();
                    v.setCursorPosition(D.get(0), D.val().length)
                }
            }, inputSelect: function (D) {
                if (D.get(0)) {
                    D.focus();
                    D.select()
                }
            }, setCursorPosition: function (E, F) {
                if (E.setSelectionRange) {
                    E.focus();
                    E.setSelectionRange(F, F)
                } else {
                    if (E.createTextRange) {
                        var D = E.createTextRange();
                        D.collapse(true);
                        D.moveEnd("character", F);
                        D.moveStart("character", F);
                        D.select()
                    }
                }
            }, showIfameMask: function (K, I) {
                var H = A.getRoot(K);
                while (H.dragMaskList.length > 0) {
                    H.dragMaskList[0].remove();
                    H.dragMaskList.shift()
                }
                if (I) {
                    var L = i("iframe", K);
                    for (var G = 0, E = L.length; G < E; G++) {
                        var F = L.get(G),
                            D = v.getAbs(F),
                            J = i("<div id='zTreeMask_" + G + "' class='zTreeMask' style='top:" + D[1] + "px; left:" + D[0] + "px; width:" + F.offsetWidth + "px; height:" + F.offsetHeight + "px;'></div>", K);
                        J.appendTo(i("body", K));
                        H.dragMaskList.push(J)
                    }
                }
            }
        },
        d = {
            addEditBtn: function (E, F) {
                if (F.editNameFlag || i(F, q.id.EDIT, E).length > 0) {
                    return
                }
                if (!v.apply(E.edit.showRenameBtn, [E.treeId, F], E.edit.showRenameBtn)) {
                    return
                }
                var G = i(F, q.id.A, E),
                    D = "<span class='" + q.className.BUTTON + " edit' id='" + F.tId + q.id.EDIT + "' title='" + v.apply(E.edit.renameTitle, [E.treeId, F], E.edit.renameTitle) + "' treeNode" + q.id.EDIT + " style='display:none;'></span>";
                G.append(D);
                i(F, q.id.EDIT, E).bind("click", function () {
                    if (!v.uCanDo(E) || v.apply(E.callback.beforeEditName, [E.treeId, F], true) == false) {
                        return false
                    }
                    j.editNode(E, F);
                    return false
                }).show()
            }, addRemoveBtn: function (D, E) {
                if (E.editNameFlag || i(E, q.id.REMOVE, D).length > 0) {
                    return
                }
                if (!v.apply(D.edit.showRemoveBtn, [D.treeId, E], D.edit.showRemoveBtn)) {
                    return
                }
                var G = i(E, q.id.A, D),
                    F = "<span class='" + q.className.BUTTON + " remove' id='" + E.tId + q.id.REMOVE + "' title='" + v.apply(D.edit.removeTitle, [D.treeId, E], D.edit.removeTitle) + "' treeNode" + q.id.REMOVE + " style='display:none;'></span>";
                G.append(F);
                i(E, q.id.REMOVE, D).bind("click", function () {
                    if (!v.uCanDo(D) || v.apply(D.callback.beforeRemove, [D.treeId, E], true) == false) {
                        return false
                    }
                    j.removeNode(D, E);
                    D.treeObj.trigger(q.event.REMOVE, [D.treeId, E]);
                    return false
                }).bind("mousedown", function (H) {
                    return true
                }).show()
            }, addHoverDom: function (D, E) {
                if (A.getRoots().showHoverDom) {
                    E.isHover = true;
                    if (D.edit.enable) {
                        j.addEditBtn(D, E);
                        j.addRemoveBtn(D, E)
                    }
                    v.apply(D.view.addHoverDom, [D.treeId, E])
                }
            }, cancelCurEditNode: function (K, L) {
                var J = A.getRoot(K),
                    G = K.data.key.name,
                    E = J.curEditNode;
                if (E) {
                    var F = J.curEditInput,
                        I = L ? L : F.val(),
                        H = !!L;
                    if (v.apply(K.callback.beforeRename, [K.treeId, E, I, H], true) === false) {
                        return false
                    } else {
                        E[G] = I ? I : F.val();
                        K.treeObj.trigger(q.event.RENAME, [K.treeId, E, H])
                    }
                    var D = i(E, q.id.A, K);
                    D.removeClass(q.node.CURSELECTED_EDIT);
                    F.unbind();
                    j.setNodeName(K, E);
                    E.editNameFlag = false;
                    J.curEditNode = null;
                    J.curEditInput = null;
                    j.selectNode(K, E, false)
                }
                J.noSelection = true;
                return true
            }, editNode: function (G, H) {
                var D = A.getRoot(G);
                j.editNodeBlur = false;
                if (A.isSelectedNode(G, H) && D.curEditNode == H && H.editNameFlag) {
                    setTimeout(function () {
                        v.inputFocus(D.curEditInput)
                    }, 0);
                    return
                }
                var F = G.data.key.name;
                H.editNameFlag = true;
                j.removeTreeDom(G, H);
                j.cancelCurEditNode(G);
                j.selectNode(G, H, false);
                i(H, q.id.SPAN, G).html("<input type=text class='rename' id='" + H.tId + q.id.INPUT + "' treeNode" + q.id.INPUT + " >");
                var E = i(H, q.id.INPUT, G);
                E.attr("value", H[F]);
                if (G.edit.editNameSelectAll) {
                    v.inputSelect(E)
                } else {
                    v.inputFocus(E)
                }
                E.bind("blur", function (I) {
                    if (!j.editNodeBlur) {
                        j.cancelCurEditNode(G)
                    }
                }).bind("keydown", function (I) {
                    if (I.keyCode == "13") {
                        j.editNodeBlur = true;
                        j.cancelCurEditNode(G)
                    } else {
                        if (I.keyCode == "27") {
                            j.cancelCurEditNode(G, H[F])
                        }
                    }
                }).bind("click", function (I) {
                    return false
                }).bind("dblclick", function (I) {
                    return false
                });
                i(H, q.id.A, G).addClass(q.node.CURSELECTED_EDIT);
                D.curEditInput = E;
                D.noSelection = false;
                D.curEditNode = H
            }, moveNode: function (N, G, Q, F, ab, H) {
                var S = A.getRoot(N),
                    L = N.data.key.children;
                if (G == Q) {
                    return
                }
                if (N.data.keep.leaf && G && !G.isParent && F == q.move.TYPE_INNER) {
                    return
                }
                var V = (Q.parentTId ? Q.getParentNode() : S),
                    P = (G === null || G == S);
                if (P && G === null) {
                    G = S
                }
                if (P) {
                    F = q.move.TYPE_INNER
                }
                var D = (G.parentTId ? G.getParentNode() : S);
                if (F != q.move.TYPE_PREV && F != q.move.TYPE_NEXT) {
                    F = q.move.TYPE_INNER
                }
                if (F == q.move.TYPE_INNER) {
                    if (P) {
                        Q.parentTId = null
                    } else {
                        if (!G.isParent) {
                            G.isParent = true;
                            G.open = !!G.open;
                            j.setNodeLineIcos(N, G)
                        }
                        Q.parentTId = G.tId
                    }
                }
                var I, K;
                if (P) {
                    I = N.treeObj;
                    K = I
                } else {
                    if (!H && F == q.move.TYPE_INNER) {
                        j.expandCollapseNode(N, G, true, false)
                    } else {
                        if (!H) {
                            j.expandCollapseNode(N, G.getParentNode(), true, false)
                        }
                    }
                    I = i(G, N);
                    K = i(G, q.id.UL, N);
                    if (!!I.get(0) && !K.get(0)) {
                        var Z = [];
                        j.makeUlHtml(N, G, Z, "");
                        I.append(Z.join(""))
                    }
                    K = i(G, q.id.UL, N)
                }
                var X = i(Q, N);
                if (!X.get(0)) {
                    X = j.appendNodes(N, Q.level, [Q], null, false, true).join("")
                } else {
                    if (!I.get(0)) {
                        X.remove()
                    }
                } if (K.get(0) && F == q.move.TYPE_INNER) {
                    K.append(X)
                } else {
                    if (I.get(0) && F == q.move.TYPE_PREV) {
                        I.before(X)
                    } else {
                        if (I.get(0) && F == q.move.TYPE_NEXT) {
                            I.after(X)
                        }
                    }
                }
                var U, T, J = -1,
                    W = 0,
                    aa = null,
                    E = null,
                    Y = Q.level;
                if (Q.isFirstNode) {
                    J = 0;
                    if (V[L].length > 1) {
                        aa = V[L][1];
                        aa.isFirstNode = true
                    }
                } else {
                    if (Q.isLastNode) {
                        J = V[L].length - 1;
                        aa = V[L][J - 1];
                        aa.isLastNode = true
                    } else {
                        for (U = 0, T = V[L].length; U < T; U++) {
                            if (V[L][U].tId == Q.tId) {
                                J = U;
                                break
                            }
                        }
                    }
                } if (J >= 0) {
                    V[L].splice(J, 1)
                }
                if (F != q.move.TYPE_INNER) {
                    for (U = 0, T = D[L].length; U < T; U++) {
                        if (D[L][U].tId == G.tId) {
                            W = U
                        }
                    }
                }
                if (F == q.move.TYPE_INNER) {
                    if (!G[L]) {
                        G[L] = new Array()
                    }
                    if (G[L].length > 0) {
                        E = G[L][G[L].length - 1];
                        E.isLastNode = false
                    }
                    G[L].splice(G[L].length, 0, Q);
                    Q.isLastNode = true;
                    Q.isFirstNode = (G[L].length == 1)
                } else {
                    if (G.isFirstNode && F == q.move.TYPE_PREV) {
                        D[L].splice(W, 0, Q);
                        E = G;
                        E.isFirstNode = false;
                        Q.parentTId = G.parentTId;
                        Q.isFirstNode = true;
                        Q.isLastNode = false
                    } else {
                        if (G.isLastNode && F == q.move.TYPE_NEXT) {
                            D[L].splice(W + 1, 0, Q);
                            E = G;
                            E.isLastNode = false;
                            Q.parentTId = G.parentTId;
                            Q.isFirstNode = false;
                            Q.isLastNode = true
                        } else {
                            if (F == q.move.TYPE_PREV) {
                                D[L].splice(W, 0, Q)
                            } else {
                                D[L].splice(W + 1, 0, Q)
                            }
                            Q.parentTId = G.parentTId;
                            Q.isFirstNode = false;
                            Q.isLastNode = false
                        }
                    }
                }
                A.fixPIdKeyValue(N, Q);
                A.setSonNodeLevel(N, Q.getParentNode(), Q);
                j.setNodeLineIcos(N, Q);
                j.repairNodeLevelClass(N, Q, Y);
                if (!N.data.keep.parent && V[L].length < 1) {
                    V.isParent = false;
                    V.open = false;
                    var O = i(V, q.id.UL, N),
                        R = i(V, q.id.SWITCH, N),
                        M = i(V, q.id.ICON, N);
                    j.replaceSwitchClass(V, R, q.folder.DOCU);
                    j.replaceIcoClass(V, M, q.folder.DOCU);
                    O.css("display", "none")
                } else {
                    if (aa) {
                        j.setNodeLineIcos(N, aa)
                    }
                } if (E) {
                    j.setNodeLineIcos(N, E)
                }
                if (!!N.check && N.check.enable && j.repairChkClass) {
                    j.repairChkClass(N, V);
                    j.repairParentChkClassWithSelf(N, V);
                    if (V != Q.parent) {
                        j.repairParentChkClassWithSelf(N, Q)
                    }
                }
                if (!H) {
                    j.expandCollapseParentNode(N, Q.getParentNode(), true, ab)
                }
            }, removeEditBtn: function (D, E) {
                i(E, q.id.EDIT, D).unbind().remove()
            }, removeRemoveBtn: function (D, E) {
                i(E, q.id.REMOVE, D).unbind().remove()
            }, removeTreeDom: function (D, E) {
                E.isHover = false;
                j.removeEditBtn(D, E);
                j.removeRemoveBtn(D, E);
                v.apply(D.view.removeHoverDom, [D.treeId, E])
            }, repairNodeLevelClass: function (E, G, F) {
                if (F === G.level) {
                    return
                }
                var H = i(G, E),
                    K = i(G, q.id.A, E),
                    J = i(G, q.id.UL, E),
                    D = q.className.LEVEL + F,
                    I = q.className.LEVEL + G.level;
                H.removeClass(D);
                H.addClass(I);
                K.removeClass(D);
                K.addClass(I);
                J.removeClass(D);
                J.addClass(I)
            }, selectNodes: function (G, E) {
                for (var F = 0, D = E.length; F < D; F++) {
                    j.selectNode(G, E[F], F > 0)
                }
            }
        },
        t = {
            tools: h,
            view: d,
            event: g,
            data: p
        };
    f.extend(true, f.fn.zTree.consts, C);
    f.extend(true, f.fn.zTree._z, t);
    var b = f.fn.zTree,
        v = b._z.tools,
        q = b.consts,
        j = b._z.view,
        A = b._z.data,
        s = b._z.event,
        i = v.$;
    A.exSetting(m);
    A.addInitBind(n);
    A.addInitUnBind(z);
    A.addInitCache(c);
    A.addInitNode(w);
    A.addInitProxy(o);
    A.addInitRoot(x);
    A.addZTreeTools(k);
    var u = j.cancelPreSelectedNode;
    j.cancelPreSelectedNode = function (F, G) {
        var H = A.getRoot(F).curSelectedList;
        for (var E = 0, D = H.length; E < D; E++) {
            if (!G || G === H[E]) {
                j.removeTreeDom(F, H[E]);
                if (G) {
                    break
                }
            }
        }
        if (u) {
            u.apply(j, arguments)
        }
    };
    var y = j.createNodes;
    j.createNodes = function (F, G, E, D) {
        if (y) {
            y.apply(j, arguments)
        }
        if (!E) {
            return
        }
        if (j.repairParentChkClassWithSelf) {
            j.repairParentChkClassWithSelf(F, D)
        }
    };
    var r = j.makeNodeUrl;
    j.makeNodeUrl = function (D, E) {
        return D.edit.enable ? null : (r.apply(j, arguments))
    };
    var a = j.removeNode;
    j.removeNode = function (E, F) {
        var D = A.getRoot(E);
        if (D.curEditNode === F) {
            D.curEditNode = null
        }
        if (a) {
            a.apply(j, arguments)
        }
    };
    var B = j.selectNode;
    j.selectNode = function (F, G, E) {
        var D = A.getRoot(F);
        if (A.isSelectedNode(F, G) && D.curEditNode == G && G.editNameFlag) {
            return false
        }
        if (B) {
            B.apply(j, arguments)
        }
        j.addHoverDom(F, G);
        return true
    };
    var e = v.uCanDo;
    v.uCanDo = function (E, F) {
        var D = A.getRoot(E);
        if (F && (v.eqs(F.type, "mouseover") || v.eqs(F.type, "mouseout") || v.eqs(F.type, "mousedown") || v.eqs(F.type, "mouseup"))) {
            return true
        }
        return (!D.curEditNode) && (e ? e.apply(j, arguments) : true)
    }
})(jQuery);