// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/*
 * @package    atto_autoclean
 * @copyright  2014 Paul Nicholls
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * @module moodle-atto_autoclean-button
 */

/**
 * Atto text editor autoclean plugin.
 *
 * @namespace M.atto_autoclean
 * @class button
 * @extends M.editor_atto.EditorPlugin
 */

Y.namespace('M.atto_autoclean').Button = Y.Base.create('button', Y.M.editor_atto.EditorPlugin, [], {
    _originalContent : null,
    initializer: function() {
        this.editor.on('paste', this.startCapture, this);
    },
    startCapture : function(e) {
        var host = this.get('host');

        // Put placeholder into editor content, store original content and clear editor.
        host.insertContentAtFocusPoint('<span class="_atto_autoclean_placeholder"></span>');
        this._originalContent = host.editor.getHTML();
        host.editor.setHTML('');

        // Allow the paste to actually happen before we try to grab the pasted content and clean it.
        Y.soon(Y.bind(this.endCapture, this));
    },
    endCapture : function() {
        var host = this.get('host'),
            range = rangy.createRange(),
            placeholder, html;

        // Move pasted content into dummy and put original content back into editor.
        dummy = Y.Node.create('<div id="_atto_autoclean_pasted_content" style="height:1px;position:absolute;left:-10000px;">'+host.editor.getHTML()+'</div>');
        host.editor.insert(dummy, 'after');
        host.editor.set('innerHTML', this._originalContent);
        placeholder = host.editor.one('._atto_autoclean_placeholder');
        range.selectNode(placeholder.getDOMNode());

        if (dummy.getHTML().length) {
            // Clean up empty font tags in IE.
            this.preClean(dummy);

            // Fix lists which come through from Word as paragraphs.
            this.fixLists(dummy);

            // Clean up unwanted inline CSS.
            dummy.all('[style]').each(this.cleanStyles, this);

            // Atto knows how to clean up a lot of the MS Word nonsense.
            html = this.get('host')._cleanHTML(dummy.getHTML());

            // Paste cleaned content at location of original selection.
            host.setSelection([range]);
            this._insertContentBeforeFocusPoint(html, range);
        } else {
            range.deleteContents();
            host.setSelection([range]);
        }

        // Remove dummy from page.
        dummy.remove(true);
    },
    preClean : function(el) {
        var spans = el.all('span');
        while (spans.size() > 0) {
            var tag = spans.pop();
            if (/mso-bookmark/.test(tag.getAttribute('style'))) {
                tag.replace(Y.Node.create(tag.get('innerHTML')));
            }
        }
        el.all('font').each(function(tag) {
            if(Y.Lang.trim(tag.getHTML()).length === 0) {
                tag.remove(true);
            }
        });
        el.all('a').each(function(tag) {
            if(tag.hasAttribute('name') && !tag.hasAttribute('href')) {
                if (tag.getHTML().length) {
                    tag.replace(Y.Node.create(tag.get('innerHTML')));
                } else {
                    tag.remove(true);
                }
            }
        });
    },
    fixLists : function(parent) {
        var inList = false,
            listRE = /mso-list:.+?level(\d+)/,
            list,
            lastnode,
            lastnodename;

        // Top-level list items come through as paragraphs with "mso-list" directives in the style attribute.
        // Other than looking at the contents of one of the extra spans to see whether it's a number/letter or bullet,
        // there isn't any obvious way to detect ordered (vs unordered) lists - so just make them all unordered; it's
        // easy enough to select the list and hit the ordered list button if that's desired.
        parent.get('children').each(function(el) {
            var level = listRE.exec(el.getAttribute('style'));
            if (level !== null) {
                var item, point;
                // Although it's theoretically possible for additional levels to be represented as paragraphs too, I've
                // only seen the first level as such - subsequent levels are actual lists (with some additional nonsense).
                // If it's found that additional levels can end up as paragraphs, some further processing based on level[1]
                // may be in order - adding new child lists etc.
                if (!inList) {
                    list = Y.Node.create('<ul></ul>');
                    parent.insertBefore(list, el);
                    inList = true;
                }

                // Find the bullet / number - can be either a text node or a span.
                point = el.get('firstChild');
                while (point.get('nodeType') === 8) {
                    // Skip the conditional comment.
                    point = point.get('nextSibling');
                }
                if (point.get('nodeName') === 'FONT') {
                    // Grab the first child of the font tag.
                    point = point.get('firstChild');
                }
                point.remove(true);

                // Add the remaining content to a real list item and add that to the list.
                item = Y.Node.create('<li>'+el.getHTML()+'</li>');
                list.appendChild(item);

                // Remove the replaced content.
                parent.removeChild(el);
            } else {
                inList = false;
            }
        }, this);

        // Combine adjacent unordered lists, since second-level and beyond come through as lists already.
        // This can result in adjacent ordered and unordered lists, but that's not necessarily a bad thing.
        parent.get('children').each(function(el) {
            var nodename = el.get('nodeName').toUpperCase();
            if (nodename === 'UL' && lastnodename === 'UL') {
                el.get('children').each(function(child) {
                    lastnode.appendChild(child);
                }, this);
                el.remove(true);
            } else {
                lastnodename = nodename;
                lastnode = el;
            }
        }, this);
    },
    /**
     * Removes unwanted inline CSS from the given element.
     *
     * @method cleanStyles
     * @param {Node} tag YUI Node representing the element to clean
     */
    cleanStyles : function(tag) {
        var styles, value;

        // Remove unwanted rules (mso-* and certain other styles).
        styles = tag.getAttribute('style').split(';');
        value = '';
        for (var i=0;i<styles.length;i++) {
            var style = styles[i].trim();
            if (!style.length || /^(mso-|tab-stops|font-family)/i.test(style)) {
                continue;
            }
            value += style+';';
        }

        if (value.length) {
            tag.setAttribute('style', value);
        } else {
            tag.removeAttribute('style');
        }
    },
    /**
     * Inserts the given HTML into the editable content at the currently focused point,
     * then shifts cursor to end of new content.
     *
     * @method _insertContentBeforeFocusPoint
     * @param {String} html
     */
    _insertContentBeforeFocusPoint: function(html, range) {
        var node = Y.Node.create(html),
            domnode = node.getDOMNode(),
            lastnode = domnode,
            host = this.get('host'),
            editor = host.editor,
            edpos, edtop, edheight, pasteheight;

        if (range) {
            if (domnode.nodeType === 11) {
                // Document fragment - collapse after last child node.
                lastnode = domnode.lastChild;
            }
            range.deleteContents();
            range.insertNode(domnode);

            // Collapse selection after pasted content.
            range.collapseAfter(lastnode);
            host.setSelection([range]);

            // Scroll editor to approximate cursor location.  Temporarily set editor to position:relative
            // so that we can get a sensible offsetTop for the last inserted node.
            edpos = editor.getStyle('position');
            editor.setStyle('position', 'relative');
            pasteheight = lastnode.offsetTop + lastnode.offsetHeight;
            editor.setStyle('position', edpos);
            pasteheight += 32; // Add 32px buffer to bottom.

            // Figure out how tall the editor is and where it's scrolled to.
            edheight = editor.get('offsetHeight');
            edtop = editor.get('scrollTop');

            // Scroll to new position.
            if (pasteheight < edtop || pasteheight > (edtop + edheight)) {
                editor.set('scrollTop', pasteheight - edheight);
            }
        }
    }
});
