/*
 * 图片上传预览插件 easyimagefile
 * Author : 李兰非
 * 有问题欢迎加入QQ群，222578556（Hello PHP），我是群主：大树。
 * */
;

/**
 * 读取一个控件的指定data属性，并通过：和；来分割成key/value值对
 * @id string 控件id
 * @name string 属性名称
 **/

if (typeof(easy_load_options) == "undefined")
{
    function easy_load_options(id, name)
    {
        var options = $("#" + id).data(name);

        //将字符串用；分割
        options = (!!options ? options.split(";") : undefined);

        if (!!options)
        {
            var data = Object();
            var index;
            for (index in options)
            {
                var temps = options[index];
                var p = temps.indexOf(":");

                var temp = [];
                if (-1 == p)
                {
                    temp[0] = temps;
                    temp[1] = "";
                }
                else
                {
                    temp[0] = temps.substring(0, p);
                    temp[1] = temps.substring(p + 1);
                }

                if (temp[0].length > 0)
                    data[temp[0]] = temp[1];
            }
        }

        return data;
    }
}


/*
 * 获得指定js文件的绝对路径
 * 该函数是网上找的，不知道谁写的，多谢了
 * */
if (typeof(get_js_path) == "undefined")
{
    function get_js_path(jsFileName)
    {
        var e = {};
        var htmlPath = "";
        var jsPath = "";
        if (document.location.protocol == 'file:')
        {
            e.BasePath = unescape(document.location.pathname.substr(1));
            e.BasePath = e.BasePath.replace(/\\/gi, '/');
            e.BasePath = 'file://' + e.BasePath.substring(0, e.BasePath.lastIndexOf('/') + 1);
            e.FullBasePath = e.BasePath;
        }
        else
        {
            e.BasePath = document.location.pathname.substring(0, document.location.pathname.lastIndexOf('/') + 1);
            e.FullBasePath = document.location.protocol + '//' + document.location.host + e.BasePath;
        }

        htmlPath = e.FullBasePath;
        var scriptTag = document.getElementsByTagName("script");
        for (var i = 0; i < scriptTag.length; i++)
        {
            if (scriptTag[i].src.lastIndexOf(jsFileName) >= 0)
            {
                var src = scriptTag[i].src.replace(/\\/gi, '/');//把\转换为/
                if (src.toLowerCase().indexOf("file://") == 0)
                {//http全路径形式 file://
                    var _temp = src.substring(0, src.lastIndexOf('/') + 1);
                    jsPath = _temp;
                    //alert("file://")
                }
                else if (src.toLowerCase().indexOf("http://") == 0)
                {//http全路径形式 http://
                    var _temp = src.substring(0, src.lastIndexOf('/') + 1);
                    jsPath = _temp;
                    //alert("http://")
                }
                else if (src.toLowerCase().indexOf("https://") == 0)
                {//http全路径形式 https://
                    var _temp = src.substring(0, src.lastIndexOf('/') + 1);
                    jsPath = _temp;
                    //alert("https://")
                }
                else if (src.toLowerCase().indexOf("../") == 0)
                {//相对路径形式 ../
                    jsPath = htmlPath + src.substring(0, src.lastIndexOf('/') + 1);
                    //alert("../")
                }
                else if (src.toLowerCase().indexOf("./") == 0)
                {//相对路径形式 ./
                    jsPath = htmlPath + src.substring(0, src.lastIndexOf('/') + 1);
                    //alert("./")
                } else if (src.toLowerCase().indexOf("/") == 0)
                {//相对路径形式 /,只有采用http访问时有效
                    if (document.location.protocol == 'http:' || document.location.protocol == 'https:')
                    {
                        var _temp = document.location.protocol + "//" + document.location.host + src.substring(0, src.lastIndexOf('/') + 1);
                        jsPath = _temp;
                    }
                    //alert("/")
                }
                else if (src.toLowerCase().search(/^([a-z]{1}):/) >= 0)
                {//盘符形式 c:
                    var _temp = src.substring(0, src.lastIndexOf('/') + 1);
                    jsPath = _temp;
                    //alert("^([a-z]+):")
                }
                else
                {//同级形式
                    jsPath = htmlPath;
                }
            }
        }

        return jsPath;
    }
}


//easyimagefile 图片文件上传
//TODO 替换内容的方式有问题，应该换成更好的html
//TODO 不能缓存提交一个默认值，在修改内容的时候，不能保持过去的值
//TODO 默认空白图片不对，可以考虑不使用img控件
(function ($, window, document, undefined)
{
    var _easyimagefile = function (input, opt)
    {
        this.input = input;
        this.id = input.attr('id');

        this.fileid = this.id + "-file";
        this.imgid = this.id + "-img";
        this.tipid = this.id + "-tip";
        this.delid = this.id + "-del";

        this.last_file = null;

        this.defaults = {
            "default": get_js_path("easyform.js") + "none.png"
        };

        this.options = $.extend({}, this.defaults, opt);
    };

    _easyimagefile.prototype = {

        init: function ()
        {
            var style = this.input.attr('style');
            var $this = this;
            var src = this.input.attr('src');

            if (!src || src.length == 0)
            {
                src = $this.options.default;
            }


            var sclass = this.input.attr('class');

            var tip_text = this.input.attr('title');

            if (!tip_text) tip_text = "";

            this.input.css("position", "relative");

            var x = this.input.position().left;
            var y = this.input.position().top;
            var w = this.input.outerWidth();
            var h = this.input.outerHeight();

            var file = "<input type='file' name='" + $this.fileid + "'  id='" + $this.fileid + "' style='display:none;'>";
            var img = "<img src='" + src + "' name='" + $this.imgid + "'  id='" + $this.imgid + "' style='" + style + ";cursor:pointer;' class='" + sclass + "'>";
            var tip = "<div id='" + $this.tipid + "' style='display:none; position:absolute;top:" + y + "px;left:" + x + "px;width:" + w + "px;height:" + h + "px;background-color:#000;text-align:center;cursor:pointer;-moz-opacity: 0.6; opacity:0.6; filter: alpha(opacity=60);color:#fff;padding-top:20%;'>" + tip_text +
                "<div id='" + $this.delid + "' style='position:absolute;top:5px;right:5px;display:block;' class='easyform-close'></div>" +
                "</div>";

            this.input.replaceWith(file + img + tip);

            var imgobj = $("#" + $this.imgid);
            var fileobj = $("#" + $this.fileid);

            var disabled = this.input.attr('disabled');

            if (!disabled)
            {
                imgobj.click(function ()
                {
                    fileobj.click();
                });

                $("#" + $this.imgid + ", #" + $this.tipid).hover(function (e)
                {
                    $("#" + $this.tipid).show();
                }, function (e)
                {
                    $("#" + $this.tipid).hide();
                });

                $("#" + $this.tipid).click(function ()
                {
                    fileobj.click();
                });

                $("#" + $this.delid).click(function (e)
                {
                    e.stopPropagation();
                    imgobj.attr("src", $this.options.default);
                    fileobj.val("");    //TODO 删除已选择的文件，未经测试。
                });

                $("#" + $this.fileid).change(function ()
                {
                    $this._onchange();
                });
            }

            return this;
        },

        _onchange: function ()
        {
            var file = $("#" + this.fileid)[0];
            var img_file = "";
            var imgobj = $("#" + this.imgid);

            //文件类型过滤
            this._type();

            this.last_file = imgobj.attr("src");

            //TODO 只有IE下能判断文件类型
            if (file.files && file.files[0])        //Firefox 下获取图片本地路径
            {
                img_file = window.URL.createObjectURL(file.files[0]);
                imgobj.attr("src", img_file);
            }
            else    //IE 下获取图片本地路径
            {
                file.select();

                img_file = document.selection.createRange().text;

                try
                {
                    imgobj[0].style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(sizingMethod=scale)";
                    imgobj[0].filters.item("DXImageTransform.Microsoft.AlphaImageLoader").src = img_file;
                }
                catch (e)
                {
                    alert("请选择一个图片文件!");
                    return false;
                }

                document.selection.empty();
            }

            var onchange = this.input.attr("onchange");

            if (!!onchange)
            {
                eval(onchange);
            }
        },

        _type: function ()
        {

            var file = $("#" + this.fileid)[0];

            var filename = file.value;

            //获得扩展名
            var ext = filename.substr(filename.lastIndexOf(".") + 1).toLowerCase();

            if (-1 == this.options.type.indexOf(ext))
            {
                alert("请选择一个" + this.options.type + "文件!");
                this.reset();
            }
        },

        reset: function ()
        {
            var old = this.fileid;

            var file = "<input type='file' name='" + this.fileid + "'  id='" + this.fileid + "' style='display:none;' >";

            $("#" + old).replaceWith(file);

            var $this = this;

            $("#" + this.fileid).change(function ()
            {
                $this._onchange();
            });
        },

        val: function ()
        {
            return $("#" + this.fileid).val();
        }
    };

    $.fn.easyimagefile = function (options)
    {

        var eif = new _easyimagefile(this, options);

        return eif.init();
    };

})(jQuery, window, document);