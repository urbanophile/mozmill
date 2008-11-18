// ***** BEGIN LICENSE BLOCK *****
// Version: MPL 1.1/GPL 2.0/LGPL 2.1
// 
// The contents of this file are subject to the Mozilla Public License Version
// 1.1 (the "License"); you may not use this file except in compliance with
// the License. You may obtain a copy of the License at
// http://www.mozilla.org/MPL/
// 
// Software distributed under the License is distributed on an "AS IS" basis,
// WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
// for the specific language governing rights and limitations under the
// License.
// 
// The Original Code is Mozilla Corporation Code.
// 
// The Initial Developer of the Original Code is
// Adam Christian.
// Portions created by the Initial Developer are Copyright (C) 2008
// the Initial Developer. All Rights Reserved.
// 
// Contributor(s):
//  Adam Christian <adam.christian@gmail.com>
//  Mikeal Rogers <mikeal.rogers@gmail.com>
// 
// Alternatively, the contents of this file may be used under the terms of
// either the GNU General Public License Version 2 or later (the "GPL"), or
// the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
// in which case the provisions of the GPL or the LGPL are applicable instead
// of those above. If you wish to allow use of your version of this file only
// under the terms of either the GPL or the LGPL, and not to allow others to
// use your version of this file under the terms of the MPL, indicate your
// decision by deleting the provisions above and replace them with the notice
// and other provisions required by the GPL or the LGPL. If you do not delete
// the provisions above, a recipient may use your version of this file under
// the terms of any one of the MPL, the GPL or the LGPL.
// 
// ***** END LICENSE BLOCK *****

var inspection = {}; Components.utils.import('resource://mozmill/modules/inspection.js', inspection);
var utils = {}; Components.utils.import('resource://mozmill/modules/utils.js', utils);

var RecorderConnector = function() {
  this.lastEvent = null;
}

RecorderConnector.prototype.toggle = function(){
  if ($('recorder').getAttribute('label') ==  'Stop'){
    this.off();
  }
  else{
    this.on();
  }
};

RecorderConnector.prototype.dispatch = function(evt){
  alert('Event recorded');
}

//Recursively bind to all the iframes and frames within
RecorderConnector.prototype.bindListeners = function(frame) {
  //Make sure we haven't already bound anything to this frame yet
  this.unbindListeners(frame);
  
  frame.addEventListener('click', this.dispatch, true);
  frame.addEventListener('dblclick', this.dispatch, true);
  frame.addEventListener('change', this.dispatch, true);
  frame.addEventListener('keypress', this.dispatch, true);
  
  var iframeCount = frame.window.frames.length;
  var iframeArray = frame.window.frames;

  for (var i = 0; i < iframeCount; i++)
  {
      try {
        iframeArray[i].addEventListener('click', this.dispatch, true);
        iframeArray[i].addEventListener('dblclick', this.dispatch, true);
        iframeArray[i].addEventListener('change', this.dispatch, true);
        iframeArray[i].addEventListener('keypress', this.dispatch, true);
        this.bindListeners(iframeArray[i]);
      }
      catch(error) {}
  }
}

//Recursively bind to all the iframes and frames within
RecorderConnector.prototype.unbindListeners = function(frame) {
  frame.removeEventListener('click', this.dispatch, true);
  frame.removeEventListener('dblclick', this.dispatch, true);
  frame.removeEventListener('change', this.dispatch, true);
  frame.removeEventListener('keypress', this.dispatch, true);
  
  var iframeCount = frame.window.frames.length;
  var iframeArray = frame.window.frames;

  for (var i = 0; i < iframeCount; i++)
  {
      try {
        iframeArray[i].removeEventListener('click', this.dispatch, true);
        iframeArray[i].removeEventListener('dblclick', this.dispatch, true);
        iframeArray[i].removeEventListener('change', this.dispatch, true);
        iframeArray[i].removeEventListener('keypress', this.dispatch, true);
        this.bindListeners(iframeArray[i]);
      }
      catch(error) {}
  }
}

RecorderConnector.prototype.on = function() {
  //Bind
  for each(win in utils.getWindows()) {
    this.bindListeners(win);
  }
  //Update UI
  $('recorder').setAttribute('label', 'Stop');
  var mmWindows = utils.getWindows('navigator:browser');
  if (mmWindows.length != 0){
    mmWindows[0].focus();
  }
};

RecorderConnector.prototype.off = function() {
  //Bind
  for each(win in utils.getWindows()) {
    this.unbindListeners(win);
  }
  $('recorder').setAttribute('label', 'Record');
};

var MozMillrec = new RecorderConnector();

// Scoping bug workarounds
var enableRec = function () {
  MozMillrec.on();
}
var disableRec = function () {
  MozMillrec.off();
}