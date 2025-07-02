;(function(jQuery) {

    jQuery.zfReport = {};
    const zfReport = jQuery.zfReport;

    let url = '';
    let uid = '';
    let token = '';
    let timestamp = '';

    zfReport.refresh = function() {
        return jQuery.ajax({
            url: _path + '/zf_report/refresh.html',
            type: 'GET',
            dataType: 'json',
            async: false,
            success: function (data) {
                url = data.url;
                uid = data.uid;
                token = data.token;
                timestamp = data.timestamp;
            }
        });
    }

    zfReport.preview = function(options) {
        zfReport.refresh();
        const uri = '/integration/jr-runtime/';
        const jrCode = options.jrCode;

        let currentUrl = url + uri + jrCode + '?_uid_=' + uid + '&_timestamp_=' + timestamp + '&_token_=' + token;

        const data = options.data;
        for (let key in data) {
            currentUrl += '&' + key + '=' + data[key];
        }
        const link = $('<a></a>').attr('target', '_blank').attr('href', currentUrl).css('display', 'none');
        $('body').append(link);
        link[0].click();
        link.remove();
    }

    zfReport.download = function(options) {
        zfReport.refresh();
        const uri = '/raw/integration/jr-export/';
        const jrCode = options.jrCode;
        const type = options.type;
        const data = options.data;
        const password = options.password;

        let currentUrl = url + uri + jrCode + '?_uid_=' + uid + '&_timestamp_=' + timestamp + '&_token_=' + token + '&_export_type_=' + type;

        if (password != null) {
            currentUrl = currentUrl + '&_password_=' + password
        }

        for (let key in data) {
            currentUrl += '&' + key + '=' + data[key];
        }
        const link = $('<a></a>').attr('target', '_blank').attr('href', currentUrl).css('display', 'none');
        $('body').append(link);
        link[0].click();
        link.remove();
    }
})($);