function run_python() {
    selected_text = editor.session.getTextRange(editor.getSelectionRange());
    input_arguments = document.getElementById("input_arguments").value;
    connect_error = '';
    var hint;
    if (hint_glow !== undefined && hint_glow !== null) {
        clearInterval(hint_glow);
    }
    $("#share-btn").popover('hide');
    if (selected_text.length > 0) {
        editor_val = selected_text;
    } else {
        editor_val = editor.getValue();
    }
    if (editor_val.trim() === '') {
        $('#run-btn').blur();
        toastr.info('Cannot Run Empty Code', 'INFO');
    } else {
        prev_result = 'in';
        document.getElementById("hint-section").innerHTML = '';
        editor_list = $(".nav-tabs").children('li');
        code_contents = [];
        active_filename = '';
        for (let i = 0; i < editor_list.length - 1; i++) {
            editor_index = parseInt($(editor_list[i]).attr('id').split('-')[1]);
            code_content = {}
            code_content['code'] = editor_session[editor_index - 1].getValue();
            code_content['file_name'] = $(editor_list[i]).children('a')[0].innerText;
            if ($(editor_list[i]).hasClass('active')) {
                active_filename = code_content['file_name'];
            }
            code_contents.push(code_content);
        }
        active_file_name = active_editor_id.html();
        document.getElementById("download_file_name").value = active_file_name.replace(/\..*/g, '').toLowerCase() + '_output.txt';
        init_ts = performance.now();
        if (typeof socket !== "undefined") {
            socket.close();
        }
        output.innerHTML = '';
        progress_status.innerHTML = '';
        $('#output').append('<div class="wrapper" id="wrap"></div><form id="term-form"><input id="term-input" autocomplete="off"></form>');
        exec_detail.innerHTML = '<span class="label label-primary"><i class="fas fa-sync-alt fa-spin"></i>&ensp;Connecting to Server</span>';
        progress_status.innerHTML = '<div class="progress" id="progress-bar"><div class="progress-bar progress-bar-primary progress-bar-striped active" role="progressbar"></div></div>';
        document.getElementById('control-btn').innerHTML = '<button type="button" class="btn btn-danger btn-sm" id="stop-btn" onclick="stop_python()">&ensp;<span>Stop</span>';
        $('#stop-btn').removeAttr('disabled');
        $('.status button').attr('disabled', 'disabled');
        $('#terminal-ad').css('display', 'none');
        $('#output').css('display', 'block');
        document.getElementById('wrap').innerHTML = '';
        socket_options['query'] = {
            type: "script",
            "lang": "python3"
        };
        socket = io(repl_host, socket_options);
        socket.emit('code', code_contents, input_arguments.substring(0, 500), active_filename);
        socket.on('reconnecting', function() {
            console.log('Reconnecting to the server!');
        });
        socket.on('connect', function() {
            console.log('Client has connected to the server');
        });
        socket.on('exit', function(data, code) {
            add_content(data);
            final_ts = Math.floor(performance.now() - init_ts) / 1000;
            if (code == 0) {
                exe_cnt += 1;
                progress_status.innerHTML = '<div class="progress" id="progress-bar"><div class="progress-bar progress-bar-success active" role="progressbar"></div></div>';
            } else if (code == 1000) {
                progress_status.innerHTML = '<div class="progress" id="progress-bar"><div class="progress-bar progress-bar-warning active" role="progressbar"></div></div>';
            } else {
                progress_status.innerHTML = '<div class="progress" id="progress-bar"><div class="progress-bar progress-bar-danger active" role="progressbar"></div></div>';
            }
            document.getElementById('control-btn').innerHTML = '<button type="button" class="btn btn-success btn-sm custom-run-btn" id="run-btn" onclick="run_python()">&ensp;<span>Run</span></button>';
            $('#run-btn').removeAttr('disabled');
            $('.status button').removeAttr('disabled');
            if (exe_cnt === 5) {
                $("#share-btn").popover('show');
                exe_cnt += 1;
                setTimeout(function() {
                    $("#share-btn").popover('hide')
                }, 7000);
            }
            if (hint !== undefined) {
                document.getElementById("hint-section").innerHTML = '<a tabindex="0" type="button" id="hint-btn" data-toggle="popover" data-placement="right" data-trigger="hover" data-content="' + hint + '" title="Hint" class="btn btn-default btn-sm status"><i class="fas fa-lightbulb"></i></button></a>';
                $("#hint-btn").popover('show');
                setTimeout(function() {
                    $("#hint-btn").popover('hide')
                }, 7000);
                hint_glow = setInterval(function() {
                    if ($("#hint-btn").css('transform').search('1.5') !== -1) {
                        $("#hint-btn").css('transform', 'scale(1.2)')
                    } else {
                        $("#hint-btn").css('transform', 'scale(1.5)')
                    }
                }, 700);
            }
            add_content('\nPress Enter to exit terminal');
            $(document).ready(function() {
                $('#term-input').focus();
                $('#term-form').submit(function(event) {
                    clear_output();
                    return false;
                });
            });
        })
        socket.on('output', function(data) {
            var encodedString = String.fromCharCode.apply(null, new Uint8Array(data));
            var buf = decodeURIComponent(escape(encodedString));
            add_content(buf, true);
        });
        socket.on('input', function(data) {
            var encodedString = String.fromCharCode.apply(null, new Uint8Array(data));
            var buf = decodeURIComponent(escape(encodedString));
            add_input_content(buf, true);
        });
        socket.on('err', function(data) {
            var encodedString = String.fromCharCode.apply(null, new Uint8Array(data));
            var buf = decodeURIComponent(escape(encodedString));
            add_err(buf);
            if (hint === undefined) hint = check_hint(buf);
        });
        socket.on('reconnect_failed', function(err) {
            console.log("Connection Failed");
            clear_content();
            add_content("Problem in connecting to the server. Below could be the possible reasons:\n", true);
            add_content("  -  Your Page can be unresponsive. Please reload your page and try.\n", true);
            add_content("  -  Your Internet might be down. Check your internet connection.\n", true);
            add_content("  -  Server may not be reachable and could be under maintenence. Please try after sometime.\n", true);
            document.getElementById('control-btn').innerHTML = '<button type="button" class="btn btn-success btn-sm custom-run-btn" id="run-btn" onclick="run_python()" id="#run">&ensp;Run</button>';
            $('#run-btn').removeAttr('disabled');
            $('.status button').removeAttr('disabled');
            socket.close();
        });
        socket.on('connect_error', function(err) {
            console.log("Connection Failed - " + err);
            connect_error = err;
        });
        $(document).ready(function() {
            $('#term-form').submit(function(event) {
                var input = $('#term-input');
                socket.send(input.val());
                return false;
            });
            var scrolledWindow = $('body').height() - $(window).height() + 0
            $(window).scrollTop(scrolledWindow);
            $('#term-input').focus();
        });
    }
}

function stop_python() {
    document.getElementById('progress-status').innerHTML = '';
    if (typeof socket !== "undefined") {
        socket.close();
    }
    final_ts = Math.floor(performance.now() - init_ts) / 1000;
    progress_status.innerHTML = '<div class="progress" id="progress-bar"><div class="progress-bar progress-bar-warning active" role="progressbar"></div></div>';
    exec_detail.innerHTML = '<span class="label label-warning"><i class="fa fa-exclamation-triangle"></i>&ensp;Aborted</span>';
    document.getElementById('control-btn').innerHTML = '<button type="button" class="btn btn-success btn-sm custom-run-btn" id="run-btn" onclick="run_python()" id="#run">&ensp;<span>Run</span></button>';
    $('#run-btn').removeAttr('disabled');
    $('.status button').removeAttr('disabled');
    add_err("\n** Process Stopped **");
    add_content('\nPress Enter to exit terminal');
    $(document).ready(function() {
        $('#term-input').focus();
        $('#term-form').submit(function(event) {
            clear_output();
            return false;
        });
    });
}

function share_code() {
    code_contents = [];
    editor_list = $(".nav-tabs").children('li');
    for (let i = 0; i < editor_list.length - 1; i++) {
        editor_index = parseInt($(editor_list[i]).attr('id').split('-')[1]);
        code_content = {}
        code_content['code'] = editor_session[editor_index - 1].getValue();
        code_content['file_name'] = $(editor_list[i]).children('a')[0].innerText;
        if ($(editor_list[i]).hasClass('active')) {
            code_content['active'] = 1;
        } else {
            code_content['active'] = 0;
        }
        code_contents.push(code_content);
    }
    request = $.ajax({
        url: site_url + "Ide/share_code",
        method: "POST",
        timeout: 30000,
        data: {
            [csrf_token_name]: csrf_token,
            code_content: JSON.stringify(code_contents),
            exp_days: $("#expiry_select").val(),
            lang: lang
        },
        dataType: "JSON",
        success: function(response) {
            $("#shareModal").modal('hide');
            if (response['output'] === true) {
                share_url = site_url + response['share_id'];
                $("#share_url_box").val(share_url);
                addthis_share['url'] = share_url;
                $("#shareModalAfter").modal('show');
            } else {
                toastr.error('Error in saving the code to server. Please try after some time', 'ERROR', {
                    timeOut: 6000
                });
            }
        },
        error: function() {
            toastr.error('Error in connecting to the server. Please try after some time', 'ERROR', {
                timeOut: 60000
            });
        },
    });
}

function get_code(share_id) {
    request = $.ajax({
        url: site_url + "Ide/get_code",
        method: "POST",
        timeout: 30000,
        data: {
            [csrf_token_name]: csrf_token,
            code_id: share_id
        },
        dataType: "JSON",
        success: function(response) {
            content = $.parseJSON(response['code']);
            if (content !== null) {
                lang = response['lang'];
                editor.session.setMode("ace/mode/python");
                active_index = 0;
                for (let i = 0; i < content.length; i++) {
                    editor_cnt += 1;
                    editor_index += 1;
                    if (content[i]['active'] === 1)
                        active_index = i;
                    if (i === 0)
                        $('.add-editor').closest('li').before('<li id="editor-' + editor_cnt + '"><a data-toggle="tab">' + content[i]['file_name'] + '</a> </li>');
                    else
                        $('.add-editor').closest('li').before('<li id="editor-' + editor_cnt + '"><a data-toggle="tab">' + content[i]['file_name'] + '</a> <span> <i class="fa fa-times"></i></span></li>');
                    editor_session[i] = ace.createEditSession('', "ace/mode/python");
                    editor_session[i].setValue(content[i]['code']);
                }
                editor.setSession(editor_session[active_index]);
                active_editor_id = $("#editor-" + (active_index + 1)).children('a').last();
                active_editor_id.tab('show');
            } else {
                toastr.info('Code does not exists. It may have expired', 'INFO', {
                    "positionClass": "toast-top-center",
                    "timeOut": 0
                });
                lang = "python3";
                editor_session[0] = ace.createEditSession('', "ace/mode/python");
                editor.setSession(editor_session[0]);
                $('.add-editor').closest('li').before('<li id="editor-1"><a data-toggle="tab">main.py</a></li>');
                active_editor_id = $("#editor-1").children('a').last();
                active_editor_id.tab('show');
            }
            update_editor_footer();
            undo_redo_update();
            editor.selection.on('changeCursor', function(e) {
                update_editor_footer();
            });
            editor.selection.on('changeSelection', function(e) {
                update_editor_footer();
            });
            editor.getSession().on('change', function() {
                undo_redo_update();
            });
        },
        error: function() {
            toastr.info('Unable to get the shared code from server. Please try after sometime', 'INFO', {
                "positionClass": "toast-top-center",
                "timeOut": 0
            });
        },
    });
}

function update_editor_footer() {
    pos = editor.session.selection.getCursor();
    row = pos["row"] + 1;
    column = pos["column"] + 1;
    selected_char = editor.session.getTextRange(editor.getSelectionRange()).length;
    if (selected_char > 0) {
        y.innerHTML = "&emsp;Ln: " + row + ",&ensp;Col: " + column + "&nbsp;(" + selected_char + " selected)"
    } else {
        y.innerHTML = "&emsp;Ln: " + row + ",&ensp;Col: " + column
    }
}

function clear_output() {
    socket.close();
    document.getElementById('progress-status').innerHTML = '';
    output.innerHTML = '';
    progress_status.innerHTML = '';
    exec_detail.innerHTML = '';
    editor.focus();
    if (display_flag) $('#terminal-ad').css('display', 'inline-block');
    $('#output').css('display', 'none');
    $('#run-btn').removeAttr('disabled');
    $('#stop-btn').attr('disabled', 'disabled');
    $('.status button').removeAttr('disabled');
    $('.status button').attr('disabled', 'disabled');
    $('.status button').tooltip('hide');
}

function copy_share_url() {
    var copyText = document.getElementById("share_url_box");
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    document.execCommand("copy");
    toastr.success('Share URL Copied', 'INFO');
}

function copy_output() {
    $('.status').blur();
    result = document.getElementById("pre");
    element_id = "pre";
    if (result === undefined || result === null) {
        result = document.getElementById("wrap");
        element_id = "wrap";
    }
    if (result) {
        var copyText = '';
        divChildren = document.getElementById(element_id).childNodes;
        for (var i = 0; i < divChildren.length; i++) {
            copyText += divChildren[i].innerText;
        }
        const textArea = document.createElement('textarea');
        textArea.setAttribute("id", "hidden_textarea");
        textArea.textContent = copyText;
        document.body.append(textArea);
        textArea.select();
        document.execCommand("copy");
        toastr.success('Result Copied to Clipboard', 'INFO');
    }
}

function download_output() {
    result = document.getElementById("pre");
    element_id = "pre";
    if (result === undefined || result === null) {
        result = document.getElementById("wrap");
        element_id = "wrap";
    }
    filename = document.getElementById("download_file_name").value;
    if (result) {
        var copyText = '';
        divChildren = document.getElementById(element_id).childNodes;
        for (var i = 0; i < divChildren.length; i++) {
            copyText += divChildren[i].innerText;
        }
        const textArea = document.createElement('textarea');
        textArea.setAttribute("id", "hidden_textarea");
        textArea.textContent = copyText;
        document.body.append(textArea);
        textArea.select();
        if (textArea.value !== '') {
            download(textArea.value, filename, "text/txt");
        } else {
            toastr.info('Cannot Download Empty Result', 'INFO');
        }
    }
}

function download_code() {
    filename = document.getElementById("code_file_name").value;
    if (editor.getValue() !== '') {
        const copyText = editor.getValue();
        const textArea = document.createElement('textarea');
        textArea.setAttribute("id", "hidden_textarea");
        textArea.textContent = copyText;
        document.body.append(textArea);
        textArea.select();
        if (textArea.value !== '') {
            download(textArea.value, filename, "text/txt");
        }
    } else {
        toastr.info('Code is blank to download', 'INFO');
    }
}

function download(content, filename, contentType) {
    if (!contentType) contentType = 'application/octet-stream';
    var a = document.createElement('a');
    var blob = new Blob([content], {
        'type': contentType
    });
    a.href = window.URL.createObjectURL(blob);
    a.download = filename;
    a.click();
}

function updateVal(currentEle, value) {
    $(document).off('click');
    $('.add-editor').attr('disabled', 'disabled');
    $(currentEle).html('<input class="thVal" type="text" value="' + value + '" />');
    $(".thVal").focus();
    $(".thVal").keyup(function(event) {
        event.stopPropagation();
        event.preventDefault();
        if (event.keyCode == 13) {
            filenames = get_filenames();
            input_filename = $(".thVal").val();
            if (input_filename !== '' && input_filename !== undefined && input_filename !== null && filenames.indexOf(input_filename) < 0) $(currentEle).html(input_filename.replace(/[^0-9A-Za-z-_\.]/g, ''));
            else $(currentEle).html(value);
            if (filenames.indexOf(input_filename) >= 0) {
                toastr.info(input_filename + ' already exits. Please choose different name.', 'INFO');
            }
            editor.focus();
            $(document).off('click');
            $('.add-editor').removeAttr('disabled');
        }
    });
    $(document).click(function(e) {
        e.stopPropagation();
        e.preventDefault();
        if ($(event.target).attr('class') != "thVal") {
            filenames = get_filenames();
            input_filename = $(".thVal").val();
            if (input_filename !== '' && input_filename !== undefined && input_filename !== null && filenames.indexOf(input_filename) < 0) $(currentEle).html(input_filename.replace(/[^0-9A-Za-z-_\.]/g, ''));
            else $(currentEle).html(value);
            if (filenames.indexOf(input_filename) >= 0) {
                toastr.info(input_filename + ' already exits. Please choose different name.', 'INFO');
            }
            editor.focus();
            $(document).off('click');
            $('.add-editor').removeAttr('disabled');
        }
    });
}

function goodbye(e) {
    if (!e) e = window.event;
    e.cancelBubble = true;
    e.returnValue = 'You sure you want to leave?';
    if (e.stopPropagation) {
        e.stopPropagation();
        e.preventDefault();
    }
}

function close_editor_tab() {
    close_tab.prev().children('a').click();
    close_tab.remove();
    editor_index -= 1;
    editor.focus();
}

function save_code_modal() {
    $('#save_file').blur();
    if (active_editor_id.html().search('<input') === -1) {
        if (editor.getValue().trim() === '') {
            toastr.info('Code is empty to save', 'INFO');
        } else {
            active_file_name = active_editor_id.html();
            document.getElementById("code_file_name").value = active_file_name.replace(/\..*/g, '').toLowerCase() + '.py';
            $("#saveEditorTab").modal('show');
        }
    }
}

function share_code_modal() {
    $('#share-btn').blur();
    $('#share-btn').popover('hide');
    $("#shareModal").modal('show');
}

function download_modal() {
    $("#downloadResult").modal('show');
}

function about_modal() {
    $("#aboutSiteModal").modal('show');
}

function ace_setting() {
    editor.showSettingsMenu();
}

function dispFile(contents) {
    editor_cnt += 1;
    editor_index += 1;
    var id = editor_cnt;
    active_editor = id;
    editor_session[active_editor - 1] = ace.createEditSession('', "ace/mode/python");
    editor.setSession(editor_session[active_editor - 1]);
    $('.add-editor').closest('li').before('<li id="editor-' + id + '"><a data-toggle="tab">' + open_file_name + '</a> <span> <i class="fa fa-times"></i></span></li>');
    active_editor_id = $(".nav-tabs li").children('a').last();
    active_editor_id.tab('show');
    editor.session.setValue(contents);
    editor.focus();
    update_editor_footer();
    editor.selection.on('changeCursor', function(e) {
        update_editor_footer();
    });
    editor.selection.on('changeSelection', function(e) {
        update_editor_footer();
    });
}

function clickElem(elem) {
    var eventMouse = document.createEvent("MouseEvents")
    eventMouse.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
    elem.dispatchEvent(eventMouse)
}

function openFile(func) {
    $('#open_file').blur();
    readFile = function(e) {
        var file = e.target.files[0];
        if (!file) {
            return;
        }
        var reader = new FileReader();
        reader.onload = function(e) {
            var contents = e.target.result;
            fileInput.func(contents)
            document.body.removeChild(fileInput)
        }
        reader.readAsText(file)
        open_file_name = file.name;
    }
    fileInput = document.createElement("input")
    fileInput.type = 'file'
    fileInput.style.display = 'none'
    fileInput.onchange = readFile
    fileInput.func = func
    document.body.appendChild(fileInput)
    clickElem(fileInput)
}

function start_terminal() {
    $('#start-term').tooltip('hide');
    if (typeof socket !== "undefined") {
        document.getElementById('control-btn').innerHTML = '<button type="button" class="btn btn-success btn-sm custom-run-btn" id="run-btn" onclick="run_python()" id="#run">&ensp;<span>Run</span></button>';
        $('#run-btn').removeAttr('disabled');
        $('.status button').removeAttr('disabled');
        socket.close();
    }
    output.innerHTML = '<div class="wrapper" id="wrap"></div><form id="term-form"><input id="term-input" autocomplete="off"></form>';
    $('#output').css('display', 'block');
    input_arguments = document.getElementById("input_arguments").value;
    socket_options['query'] = {
        type: "shell"
    };
    socket = io(repl_host, socket_options);
    exec_detail.innerHTML = '<span class="label label-primary"><i class="fas fa-sync-alt fa-spin"></i>&ensp;Connecting to Server</span>';
    socket.on('connect', function() {
        console.log('Client has connected to the server!');
        clear_content();
    });
    socket.on('reconnecting', function() {
        console.log('Reconnecting to the server!');
    });
    socket.on('exit', function(data, code) {
        shell_add_content(data);
        shell_add_content('\nPress Enter to exit terminal');
        $(document).ready(function() {
            $('#term-input').focus();
            $('#term-form').submit(function(event) {
                clear_output();
                return false;
            });
        });
    })
    socket.on('output', function(data) {
        var buf = String.fromCharCode.apply(null, new Uint8Array(data));
        shell_add_content(buf);
    });
    socket.on('err', function(data) {
        var buf = String.fromCharCode.apply(null, new Uint8Array(data));
        shell_add_err(buf);
    });
    socket.on('reconnect_failed', function() {
        console.log("Connection Failed");
        exec_detail.innerHTML = '';
        shell_add_content("Problem in connecting to the server. Below could be the possible reasons:");
        shell_add_content("  -  Your Page can be unresponsive. Please reload your page and try.");
        shell_add_content("  -  Your Internet might be down. Check your internet connection.");
        shell_add_content("  -  Server may not be reachable and could be under maintenence. Please try after sometime.");
    });
    $(document).ready(function() {
        $("#term-form").keyup(function(event) {
            if (event.keyCode == 38) {
                if (command_index === 0) {
                    beep();
                }
                if (command_index === command_list.length) {
                    cur_cmd = $('#term-input').val();
                }
                command_index = command_index > 0 ? command_index - 1 : command_index;
                if (command_list.length > 0) {
                    document.getElementById("term-input").value = command_list[command_index];
                }
            }
            if (event.keyCode == 40) {
                if (command_index === command_list.length) {
                    beep();
                }
                if (command_index === command_list.length) {
                    cur_cmd = $('#term-input').val();
                }
                command_index = command_index < command_list.length ? command_index + 1 : command_index;
                if (command_index === command_list.length) {
                    document.getElementById("term-input").value = cur_cmd;
                } else {
                    document.getElementById("term-input").value = command_list[command_index];
                }
            }
        });
        $('#term-form').submit(function(event) {
            var input = $('#term-input');
            socket.send(input.val());
            if (input.val().trim() !== "" && input.val().trim() !== command_list[command_list.length - 1]) {
                command_list.push(input.val());
            }
            command_index = command_list.length;
            return false;
        });
        $('#term-input').focus();
    });
}

function add_content(bashOutput, focus) {
    bashOutput = $('<div>').text(bashOutput).html();
    $('.wrapper').append('<p id="term-output">' + bashOutput + '</p>');
    document.getElementById('term-form').innerHTML = '<input id="term-input" autocomplete="off">';
    if (focus) {
        $('#term-input').focus();
    }
    var scrolledWindow = $('body').height() - $(window).height() + 0;
    $(window).scrollTop(scrolledWindow);
    if (bashOutput !== '' && bashOutput.slice(-1) !== "\n") prev_result = 'out';
}

function add_input_content(bashOutput, focus) {
    if (prev_result === 'in') {
        bashOutput = bashOutput.replace(/^\n/, '');
    }
    bashOutput = $('<div>').text(bashOutput).html();
    $('.wrapper').append('<p id="term-output">' + bashOutput + '</p>');
    document.getElementById('term-form').innerHTML = '<input id="term-input" autocomplete="off">';
    if (focus) {
        $('#term-input').focus();
    }
    var scrolledWindow = $('body').height() - $(window).height() + 0;
    $(window).scrollTop(scrolledWindow);
    prev_result = 'in';
}

function clear_content() {
    progress_status.innerHTML = '';
    document.getElementById('wrap').innerHTML = '';
    exec_detail.innerHTML = '';
    $('#run-btn').removeAttr('disabled');
    $('#stop-btn').attr('disabled', 'disabled');
    $('.status button').removeAttr('disabled');
}

function add_err(bashError) {
    cur = bashError.slice(-4);
    if (cur === '>>> ' || cur === '... ') {
        bashError = bashError.slice(0, -4);
    } else {
        cur = ""
    }
    bashError = $('<div>').text(bashError).html();
    bashError_list = bashError.split("\n");
    document.getElementById('term-form').innerHTML = cur + '<input id="term-input" autocomplete="off">';
    for (i = 0; i < bashError_list.length; i++) {
        if (bashError_list[i].trim() === "") {
            continue;
        }
        if (bashError_list[i].slice(0, 6) === 'Python' || bashError_list[i].slice(0, 4) === 'Type' || bashError_list[i].slice(0, 4) === '[GCC') {
            $('.wrapper').append('<p id="term-output">' + bashError_list[i] + '\n</p>');
        } else if (bashError_list[i].search('Error:') !== -1) {
            $('.wrapper').append('<p id="term-output" class="error">' + bashError_list[i] + '\n</p>');
        } else {
            $('.wrapper').append('<p id="term-output" class="warning">' + bashError_list[i] + '\n</p>');
        }
    }
    var scrolledWindow = $('body').height() - $(window).height() + 0
    $(window).scrollTop(scrolledWindow);
    $('#term-input').focus();
}

function shell_add_content(bashOutput) {
    bashOutput = $('<div>').text(bashOutput).html();
    $('.wrapper').append('<p id="shell-output">' + bashOutput + '</p>');
    document.getElementById('term-form').innerHTML = '<input id="term-input" autocomplete="off">';
    $('#term-input').focus();
    var scrolledWindow = $('body').height() - $(window).height() + 0
    $(window).scrollTop(scrolledWindow);
}

function shell_add_err(bashError) {
    cur = bashError.slice(-4);
    if (cur === '>>> ' || cur === '... ') {
        bashError = bashError.slice(0, -4);
    } else {
        cur = ""
    }
    bashError = $('<div>').text(bashError).html();
    bashError_list = bashError.split("\n");
    document.getElementById('term-form').innerHTML = cur + '<input id="term-input" autocomplete="off">';
    for (i = 0; i < bashError_list.length; i++) {
        if (bashError_list[i].slice(0, 6) === 'Python' || bashError_list[i].slice(0, 4) === 'Type' || bashError_list[i].slice(0, 4) === '[GCC') {
            $('.wrapper').append('<p id="shell-output">' + bashError_list[i] + '</p>');
        } else if (bashError_list[i].search('Error:') !== -1) {
            $('.wrapper').append('<p id="shell-output" class="error">' + bashError_list[i] + '</p>');
        } else {
            $('.wrapper').append('<p id="shell-output" class="warning">' + bashError_list[i] + '</p>');
        }
    }
    var scrolledWindow = $('body').height() - $(window).height() + 0
    $(window).scrollTop(scrolledWindow);
    $('#term-input').focus();
}

function beep() {
    var snd = new Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");
    snd.play();
}

function get_filenames() {
    editor_list = $(".nav-tabs").children('li');
    filenames = []
    for (let i = 0; i < editor_list.length - 1; i++) {
        filenames.push($(editor_list[i]).children('a')[0].innerText);
    }
    return filenames;
}

function get_host() {
    return "https://repl.online-cpp.com";
}

function undo_redo_update() {
    if (!editor.session.getUndoManager().hasRedo()) {
        $('#redo-editor').attr('disabled', 'disabled');
    } else {
        $('#redo-editor').removeAttr('disabled');
    }
    if (!editor.session.getUndoManager().hasUndo()) {
        $('#undo-editor').attr('disabled', 'disabled');
    } else {
        $('#undo-editor').removeAttr('disabled');
    }
    $('#undo-editor').tooltip('hide');
    $('#redo-editor').tooltip('hide');
}

function check_hint(err_text) {
    if (err_text.search('ModuleNotFoundError') !== -1) {
        hint = "Run command - help('modules') to find the list of available modules";
    } else if (err_text.search('c: No such file or directory') !== -1) {
        hint = "Change the file name to main.c";
    } else if (err_text.search('cpp: No such file or directory') !== -1) {
        hint = "Change the file name to main.cpp";
    } else {
        hint = undefined;
    }
    return hint;
}