////////////////////////////////////////////////////////////////
/// Mode line and bars

tab_bar_button_close = 1;
tab_bar_show_icon = true;

// Widget to display profile name in the mode-line.
function profile_name_widget (window) {
    this.class_name = "profile-name-widget";
    text_widget.call(this, window);
}
profile_name_widget.prototype = {
    constructor: profile_name_widget,
    __proto__: text_widget.prototype,
    update: function () {
        this.view.text = current_profile;
    }
};

add_hook("mode_line_hook", mode_line_adder(profile_name_widget));
remove_hook("mode_line_hook", mode_line_adder(clock_widget));

function toggle_all_bars (window, state) {
    // Set to STATE or toggle if STATE is not a boolean
    // the visibility of tab_bar, minibuffer and mode_line.
    if ( !(state === true || state === false) )
        state = window.minibuffer.element.collapsed;
    window.minibuffer.element.collapsed = !state;
    tab_bar_mode(state);
    if (window.mode_line)
        window.mode_line.container.collapsed = !state;
}

interactive("toggle-all-bars",
            "Hide or show tab-bar, minibuffer and mode-line",
            function (I) { toggle_all_bars(I.window) });

////////////////////////////////////////////////////////////////
/// Colors

active_hint_background_color = "#7ACF19";
active_img_hint_background_color = "#AEEE66";
hint_background_color = "#F6F38A";
img_hint_background_color = "#FCF9A5";

////////////////////////////////////////////////////////////////
/// CSS themes

// Used resources:
//   http://conkeror.org/Appearance
//   http://conkeror.org/Tips#Darken_the_current_page
//   https://github.com/scottjad/dotfiles/blob/master/.conkerorrc/color-theme.js
//   https://developer.mozilla.org/en-US/Add-ons/Code_snippets/File_I_O

var global_themes = {};
var css_dir = al_load_dir.clone();
css_dir.append("css");

Components.utils.import("resource://gre/modules/NetUtil.jsm");

// Define 2 interactive commands for a theme NAME with stylesheets
// defined in a css FILE:
// - "apply-NAME-theme" applies the theme to the current document;
// - "toggle-NAME-theme" loads/unloads the theme globally.
function define_theme (name, file) {
    var styles;
    NetUtil.asyncFetch(file, function(inputStream, status) {
        if (!Components.isSuccessCode(status)) {
            dumpln("File not found: " + file);
            return;
        }
        styles = escape(NetUtil.readInputStreamToString(inputStream, inputStream.available()));
    });
    interactive("apply-" + name + "-theme",
                "Apply " + name + " color theme to the current document",
                function (I) {
                    var document = I.buffer.document;
                    var newSS = document.createElement("link");
                    newSS.rel = "stylesheet";
                    // Making URI to a local file in `href' doesn't work,
                    // so we had to read the file and pass it as CSS data.
                    newSS.href = "data:text/css," + styles;
                    document.getElementsByTagName("head")[0].appendChild(newSS);
                });

    global_themes[name] = false;
    interactive("toggle-" + name + "-theme",
                "Toggle " + name + " color theme globally",
                function (I) {
                    if (global_themes[name]) {
                        unregister_user_stylesheet(file);
                        global_themes[name] = false;
                    } else {
                        register_user_stylesheet(file);
                        global_themes[name] = true;
                    }
                });
}

// Define themes for all "*.css" files from dir.
function define_themes (dir) {
    if (dir.isDirectory()) {
        var entries = dir.directoryEntries;
        while (entries.hasMoreElements()) {
            var entry = entries.getNext();
            entry.QueryInterface(Ci.nsIFile);
            var filename = entry.leafName;
            if (filename.substr(-4).toLowerCase() == ".css")
                define_theme(filename.substr(0, filename.length-4), entry);
        }
    } else {
        dumpln(dir.path + " is not a directory");
    }
}

define_themes(css_dir);

