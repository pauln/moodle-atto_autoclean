YUI.add("moodle-atto_autoclean-button",function(e,t){e.namespace("M.atto_autoclean").Button=e.Base.create("button",e.M.editor_atto.EditorPlugin,[],{_dummyInserted:!1,initializer:function(){this.editor.on("paste",this.insertDummy,this)},insertDummy:function(t){var n=this.get("host"),r=rangy.createRange(),i;this._dummyInserted||(n.saveSelection(),i=e.Node.create('<div id="_atto_autoclean_pasted_content" contenteditable="true" style="position:absolute;left:-10000px;height:1px"></div>'),n.editor.insert(i,"after"),r.selectNodeContents(i.getDOMNode()),n.setSelection([r]),this._dummyInserted=!0),e.soon(e.bind(this.spitDummy,this))},spitDummy:function(){var t=this.get("host"),n=e.one("#_atto_autoclean_pasted_content");if(!this._dummyInserted)return;this.fixLists(n),html=this.deepCleanHTML(n.getHTML()),t.restoreSelection(),this._insertContentBeforeFocusPoint(html),n.remove(!0),this._dummyInserted=!1},fixLists:function(t){var n=!1,r=/mso-list:.+?level(\d+)/,i,s,o;t.get("children").each(function(s){var o=r.exec(s.getAttribute("style"));if(o!==null){var u,a;n||(i=e.Node.create("<ul></ul>"),t.insertBefore(i,s),n=!0),a=s.get("firstChild");while(a.get("nodeType")===8)a=a.get("nextSibling");a.remove(!0),u=e.Node.create("<li>"+s.getHTML()+"</li>"),i.appendChild(u),t.removeChild(s)}else n=!1},this),t.get("children").each(function(e){var t=e.get("nodeName").toUpperCase();t==="UL"&&o==="UL"?(e.get("children").each(function(e){s.appendChild(e)},this),e.get("parentNode").removeChild(e)):(o=t,s=e)},this)},deepCleanHTML:function(e){return e=this.get("host")._cleanHTML(e),e=e.replace(/<(o|u)l[^>]+?type="[^"]+?"/gi,"<$1l"),e=e.replace(/(<[^>]+?style="[^"]*)line-height:normal;?/gi,"$1"),e=e.replace(/(<[^>]+?style="[^"]*)tab-stops:[^;"]+?(;|")/gi,"$1$2"),e=e.replace(/(<[^>]+?) style=";?"/gi,"$1"),e=e.replace(/(<[^>]+? style=")([^"]+)"/gi,function(e,t,n){return t+n.replace(/&quot;/gi,"'")+'"'}),e},_insertContentBeforeFocusPoint:function(t){var n=rangy.getSelection(),r,i=e.Node.create(t),s=i.getDOMNode(),o=s,u=this.get("host"),a=u.editor,f,l,c,h;n.rangeCount&&(r=n.getRangeAt(0)),r&&(s.nodeType===11&&(o=s.lastChild),r.deleteContents(),r.insertNode(s),r.collapseAfter(o),u.setSelection([r]),f=a.getStyle("position"),a.setStyle("position","relative"),h=o.offsetTop+o.offsetHeight,a.setStyle("position",f),h+=32,c=a.get("offsetHeight"),l=a.get("scrollTop"),(h<l||h>l+c)&&a.set("scrollTop",h-c))}})},"@VERSION@",{requires:["moodle-editor_atto-plugin"]});