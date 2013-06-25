var active_meme, active_font = 'Impact',
  color1 = $('input[name=color1]'),
  color2 = $('input[name=color2]'),
  canvas = $('#cvs')[0],
  top_input = $('#text-top'),
  bottom_input = $('#text-bottom'),
  padding_x = $('#padding-x'),
  padding_y = $('#padding-y'),
  meme_list_container = $('#meme-list-container'),
  generate = $('#generate'),
  userlink = $('#img-directlink'),
  is_persistent = $('#persistent-data'),
  font_size = $("#font-size"),
  outline_size = $("#outline-size"),
  client_id = 'e8016e23a895cb9', // ew
  ctx = canvas.getContext('2d'),
  PATH = 'memes/',
  img = $("<img />")[0],
  img_is_loaded = false;

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
    $('#spinner-loading').hide();
    var maxh = 640,
      maxw = 480,
      height = img.height,
      width = img.width,
      top = top_input.val(),
      bottom = bottom_input.val(),
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

    ctx.font = "bold " + font_size_val + "px " + active_font;
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
  $('#spinner-loading').show();
  meme_list_container.find('li.active').removeClass('active');
  $(this).addClass('active');
  active_meme = $(this).find('option:selected').data('img');
  img_is_loaded = false;
  img.src = PATH + active_meme;
  draw();
  if (e) {
    e.preventDefault();
  }
}

function image_uploaded(data) {
  // Notifier.success('Your image has been uploaded successfully.', 'Complete!');
  $('#upload-success').modal('show');
  $('#spinner-generate').hide();
  userlink.val(data['data']['link']);
  $('#img-imgurlink').val('http://imgur.com/' + data['data']['id']);
  userlink[0].select();
  userlink[0].focus();
  $('#img-submitreddit').attr('href', 'http://www.reddit.com/submit?url=' + escape(data['data']['link']));
}

function image_upload_failed() {
  Notifier.error('Could not reach imgur service. Enter a new API Key or wait a few minutes and try again.', 'Error!');
  $('#spinner-generate').hide();
}

function generate_meme(e) {
  $('#spinner-generate').show();
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
  $([top_input[0], bottom_input[0]]).on('keyup', draw); // Redraw if meme text modified.
  meme_list_container.on('change', swap_active_meme); // Redraw if active meme switched.
  generate.on('click', generate_meme); // Generate meme on generate button click

  $('#form-reset').on('click', function (e) { $('#meme-settings')[0].reset(); draw(); });
  /* quick and dirty disable form submission */
  $('form').submit(function (e) {
    e.preventDefault();
    return false;
  });

  // Initialize Bootstrap modals.
  $('.modal').modal({
    show: false
  });

  // Initialize Spectrum color pickers.
  $('input[type=color]').spectrum({
    clickoutFiresChange: true,
    showButtons: false,
    showInput: true,
    change: function (tinycolor) { draw(); } // Redraw if color changed.
  });

  $(document).on('dragover', function (e) {
    e.preventDefault();
    return false;
  });

  $(document).on('drop', function (e) {
    var data = e.dataTransfer || e.originalEvent.dataTransfer;
    if (data.files.length === 1) {
      img_is_loaded = false;
      $('#spinner-loading').show();
      var file = data.files[0];
      if (file.type.indexOf('image') === -1) {
        Notifier.error('Not an image!', 'you may only drop images to the page');
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
      Notifier.error('Too many files!', 'you may only drop one image at a time to the page');
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
  }; /* draw the default image */

  setTimeout(draw, 200); // hack fix
}

init();
