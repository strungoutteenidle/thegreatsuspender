/*global chrome */
(function () {
    'use strict';

    var gsAnalytics = chrome.extension.getBackgroundPage().gsAnalytics;
    var gsUtils = chrome.extension.getBackgroundPage().gsUtils;
    var tgs = chrome.extension.getBackgroundPage().tgs;
    var currentTabs = {};

    function generateTabInfo(info) {
        var html = '',
            windowId = info && info.windowId ? info.windowId : '?',
            tabId = info && info.tabId ? info.tabId : '?',
            tabTitle = info && info.tab ? gsUtils.htmlEncode(info.tab.title) : 'unknown',
            tabTimer = info ? info.timerUp : -1,
            tabStatus = info ? info.status : 'unknown';

        html += '<tr>';
        html += '<td>' + windowId + '</td>';
        html += '<td>' + tabId + '</td>';
        html += '<td style="max-width:800px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + tabTitle + '</td>';
        html += '<td>' + tabTimer + '</td>';
        html += '<td>' + tabStatus + '</td>';
        html += '</tr>';

        return html;
    }

    function fetchInfo() {
        chrome.tabs.query({}, function (tabs) {
            tabs.forEach(function (curTab, i, tabs) {
                currentTabs[tabs[i].id] = tabs[i];

                tgs.requestDebugInfo(curTab.id, function (debugInfo) {
                    if (chrome.runtime.lastError) {
                        gsUtils.error('debug', chrome.runtime.lastError.message);
                    }

                    var html,
                        tableEl = document.getElementById('gsProfilerBody');

                    debugInfo.tab = curTab;

                    html = generateTabInfo(debugInfo);
                    tableEl.innerHTML = tableEl.innerHTML + html;
                });
            });
        });
    }

    gsUtils.documentReadyAndLocalisedAsPromsied(document).then(function () {
        fetchInfo();

        document.getElementById('refreshProfiler').onclick = function (e) {
            document.getElementById('gsProfilerBody').innerHTML = '';
            fetchInfo();
        };

        document.getElementById('toggleDebugInfo').innerHTML = gsUtils.isDebugInfo();
        document.getElementById('toggleDebugInfo').onclick = function (e) {
            gsUtils.setDebugInfo(!gsUtils.isDebugInfo());
            document.getElementById('toggleDebugInfo').innerHTML = gsUtils.isDebugInfo();
        };

        document.getElementById('toggleDebugError').innerHTML = gsUtils.isDebugError();
        document.getElementById('toggleDebugError').onclick = function (e) {
            gsUtils.setDebugError(!gsUtils.isDebugError());
            document.getElementById('toggleDebugError').innerHTML = gsUtils.isDebugError();
        };

        var extensionsUrl = `chrome://extensions/?id=${chrome.runtime.id}`;
        document.getElementById('backgroundPage').setAttribute('href', extensionsUrl);
        document.getElementById('backgroundPage').onclick = function () {
            chrome.tabs.create({ url: extensionsUrl});
        };

        /*
        chrome.processes.onUpdatedWithMemory.addListener(function (processes) {
            chrome.tabs.query({}, function (tabs) {
                var html = '';
                html += generateMemStats(processes);
                html += '<br />';
                html += generateTabStats(tabs);
                document.getElementById('gsProfiler').innerHTML = html;
            });
        });
        */
    });
    gsAnalytics.reportPageView('debug.html');
}());
