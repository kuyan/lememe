var
  // Options
  active_meme,
  color1 = $('input[name=color1]'),
  color2 = $('input[name=color2]'),
  font = 'Impact',
  font_size = $("#font-size"),
  line1 = $('#text-top'),
  line2 = $('#text-bottom'),
  outline_size = $("#outline-size"),
  padding_x = $('#padding-x'),
  padding_y = $('#padding-y'),
  // Elements
  canvas = $('#cvs')[0],
  meme_list_container = $('#meme-list-container'),
  generate_button = $('#generate'),
  userlink = $('#img-directlink'),
  hotlink = $('#img-directlink'),
  page_link = $('#img-imgurlink'),
  reddit_link = $('#img-submitreddit'),
  delete_link = $('#img-delete'),
  alert_row = $('#alert-row'),
  loading_bar = $('#loading-bar')
  //
  client_id = 'e8016e23a895cb9', // ew
  ctx = canvas.getContext('2d'),
  PATH = 'memes/',
  img = $("<img />")[0],
  img_is_loaded = false;

function set_generate_button_state(state) {
  switch (state) {
    case 'loading':
      generate_button.button('loading');
      generate_button.addClass('btn-progress');
      break;
    case 'reset':
      generate_button.button('reset');
      generate_button.removeClass('btn-progress');
      break;
  }
}

function set_loading_bar_state(state) {
  switch (state) {
    case 'show':
      loading_bar.show();
      break;
    case 'hide':
      loading_bar.hide();
      break;
  }
}

function display_alert(severity, title, text) {
  $('#alert-triggered').alert('close');
  var alert = ' <div class="alert alert-' + severity + ' fade in out" id="alert-triggered"><button type="button" class="close" data-dismiss="alert">&times;</button><strong>' + title + '</strong> ' + text + '</div>';
  alert_row.append(alert);
}
/* takes a string and a maxWidth and splits the text into lines */

function fragmentText(text, maxWidth) {
  var words = text.split(' '),
    lines = [],
    line = "";
  if (ctx.measureText(text).width < maxWidth) {
    return [text];
  }
  while (words.length > 0) {
    while (ctx.measureText(words[0]).width >= maxWidth) {
      var tmp = words[0];
      words[0] = tmp.slice(0, -1);
      if (words.length > 1) {
        words[1] = tmp.slice(-1) + words[1];
      } else {
        words.push(tmp.slice(-1));
      }
    }
    if (ctx.measureText(line + words[0]).width < maxWidth) {
      line += words.shift() + " ";
    } else {
      lines.push(line);
      line = "";
    }
    if (words.length === 0) {
      lines.push(line);
    }
  }
  return lines;
}

/* Draw the canvas */

function draw() {
  if (img_is_loaded) {
    var maxh = 640,
      maxw = 480,
      height = img.height,
      width = img.width,
      top = line1.val(),
      bottom = line2.val(),
      font_size_val = parseInt(font_size.val(), 0),
      pad_y_val = parseInt(padding_y.val(), 0),
      pad_x_val = parseInt(padding_x.val(), 0);

    while (height > maxh || width > maxw) {
      --height;
      --width;
    }

    canvas.height = height;
    canvas.width = width;
    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    ctx.font = "bold " + font_size_val + "px " + font;
    ctx.textAlign = "center";
    ctx.fillStyle = color1.val();

    top_lines = fragmentText(top, width - font_size_val - pad_x_val);
    bottom_lines = (fragmentText(bottom, width - font_size_val - pad_x_val)).reverse(); // reverse it for bottom up!

    top_lines.forEach(function (line, i) {
      ctx.fillText(line, width / 2, pad_y_val + ((i + 1) * font_size_val));
    });
    bottom_lines.forEach(function (line, i) {
      ctx.fillText(line, width / 2, height - (pad_y_val + (i * font_size_val)));
    });

    if (outline_size.val() > 0) {
      ctx.strokeStyle = color2.val();
      ctx.lineWidth = outline_size.val();

      top_lines.forEach(function (line, i) {
        ctx.strokeText(line, width / 2, pad_y_val + ((i + 1) * font_size_val));
      });
      bottom_lines.forEach(function (line, i) {
        ctx.strokeText(line, width / 2, height - (pad_y_val + (i * font_size_val)));
      });

    }

    ctx.restore();
  } else {
    setTimeout(draw, 100);
  }
}

function swap_active_meme(e) {
  set_loading_bar_state('show');
  active_meme = $(this).find('option:selected').data('img');
  img_is_loaded = false;
  img.src = PATH + active_meme;
  draw();
}

function image_uploaded(data) {
  // Fill in the modal before it's shown
  hotlink.val(data['data']['link']);
  page_link.val('http://imgur.com/' + data['data']['id']);
  reddit_link.attr('href', 'http://www.reddit.com/submit?url=' + escape(data['data']['link']));
  delete_link.attr('href', 'http://imgur.com/delete/' + data['data']['deletehash']);

  $('#upload-success').modal('show');
  hotlink[0].select();
  hotlink[0].focus();

  set_generate_button_state('reset');
}

function image_upload_failed() {
  display_alert('error', "Huh, that's odd.", "Memecap couldn't contact Imgur's servers. Try again in a few minutes?");
  set_generate_button_state('reset');
}

function generate_meme(e) {
  set_generate_button_state('loading');
  var dataURL = canvas.toDataURL("image/png").split(',')[1];
  $.ajax({
    url: 'https://api.imgur.com/3/image',
    type: 'POST',
    data: {
      type: 'base64',
      image: dataURL
    },
    dataType: 'json',
    headers: {'Authorization': 'Client-ID ' + client_id}
  }).success(image_uploaded).error(image_upload_failed);
  e.preventDefault();
  return false;
}

function filter_list(text) {
  if (typeof text != 'undefined' && text.length > 0) {
    meme_list_container.find('li:not(.nav-header)').each(function (i, el) {
      if ($(this).text().toLowerCase().indexOf(text.toLowerCase()) === -1) {
        $(this).hide();
      } else if ($(this).is(':hidden')) {
        $(this).show();
      }
    });
  } else {
    meme_list_container.find('li:not(.nav-header)').show();
  }
}

function register_events() {
  meme_list_container.on('change reset', swap_active_meme); // Redraw if active meme switched.
  $('#meme-settings :input[type=text]').on('input reset', draw); // Redraw if any input changes.
  generate_button.on('click', generate_meme); // Generate meme on generate form submit

  // Reset meme options on reset button trigger
  $('#form-reset').on('click', function (e) {
    $('#meme-settings')[0].reset();
    swap_active_meme.call(meme_list_container);
    set_loading_bar_state('hide'); // kinda dirty fix... i think
  });

  // Prevent conventional form submission
  $('form').on('submit', function (e) {
    e.preventDefault();
  });

  // Initialize Bootstrap modals.
  $('.modal').modal({
    show: false
  });

  // Initialize Bootstrap buttons.
  generate_button.button();

  // Initialize Spectrum color pickers.
  $('input[type=color]').spectrum({
    clickoutFiresChange: true,
    showButtons: false,
    showInput: true,
    change: function (tinycolor) { draw(); } // Redraw if color changed.
  });

  // // Drag to upload
  $(document).on('dragover', function (e) {
    e.preventDefault();
    return false;
  });

  $(document).on('drop', function (e) {
    var data = e.dataTransfer || e.originalEvent.dataTransfer;
    if (data.files.length === 1) {
      img_is_loaded = false;
      set_loading_bar_state('show');
      var file = data.files[0];
      if (file.type.indexOf('image') === -1) {
        display_alert('error', 'Not an image!', 'You may only drop images on the page.');
        e.preventDefault();
        return false;
      }
      var reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = function (ev) {
        img_is_loaded = false;
        img.src = ev.target.result;
        draw();
      };
    } else {
      display_alert('error', 'Too many files!', 'You can only drop one image on the page at a time.');
    }
    e.preventDefault();
    return false;
  });

}

function init() {
  register_events();
  active_meme = meme_list_container.find('option[selected]').data('img');

  img_is_loaded = false;
  img.src = PATH + active_meme;

  img.onload = function (e) {
    img_is_loaded = true;
    set_loading_bar_state('hide');
  };

  // Draw the default image.
  setTimeout(draw, 200); // hack fix
}

init();
