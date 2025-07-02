//# sourceURL=zzxkYzbZy.js 
jQuery(function($){
	/***首页数据修改（开始）***/
	$("#xkxn").text($("#xkxnmc").val());
	$("#xkxq").text($("#xkxqmc").val());
	$("#txt_xklc").html("<font color='red'>"+$("#xklcmc").val()+"</font>");
	
	if($("#xkxfqzfs").val()=="1"){
		$("#yxxfs_jxb").text($("#zxfs").val());
	}else{
		$("#yxxfs").text($("#zxfs").val());
	}

	var syts = $("#syts").val();
	var syxs = $("#syxs").val();
	if($("#isinxksj").val()=="1"){
		if(syts > 1){
			$("#sysj").html("（<b><font size='3px'>"+$.i18n.prop("syjts", [syts])+"</font></b>）");
		}else if(syxs>=1){
			$("#sysj").html("（<b><font size='3px'>"+$.i18n.prop("syjxs", [syxs])+"</font></b>）");
		}else{
			$("#sysj").html("（<b><font size='3px'>"+$.i18n.get("sybzxs")+"</font></b>）");
		}
	}else{
		if(syts > 1){
			$("#sysj").html("（<b><font size='3px'>"+$.i18n.prop("jxkkssyts", [syts])+"</font></b>）");
		}else if(syxs>=1){
			$("#sysj").html("（<b><font size='3px'>"+$.i18n.prop("jxkkssyxss", [syxs])+"</font></b>）");
		}else{
			$("#sysj").html("（<b><font size='3px'>"+$.i18n.get("jxkkssybzxs")+"</font></b>）");
		}
	}
	if($("#xxdm").val()=="10295"){
		if($("#bxqzgxkxf").val()>0){
			$("#bxqbkkklxzgxf").html($.i18n.prop("bxqbkklxzgxf", [$("#bxqzgxkxf").val()]));
		}else{
			$("#bxqbkkklxzgxf").html("");
		}
		var bkklxyxxf=0;
		var kklxdm=$("#kklxdm").val();
		$(".right_div .list-group").each(function(idx,itm){
			if($(itm).data("kklxdm")==kklxdm){
				bkklxyxxf = bkklxyxxf+$(itm).find("input[name='right_xf']").val()*1;
			}
		});
		$("#bxqbkkklxyxxf").html(bkklxyxxf);
	}
	if(jQuery("#firstKklxdm").val()=="01" && $("#sfyjxk").val()=="1"){
		$("#quickXk").html("<button type='button' class='btn btn-primary btn-sm btn-quick' onclick='chooseCoursesQuickly()'>"+$.i18n.get("msg_yjxk")+"</button>");//一键选课
	}else if(jQuery("#kklxdm").val()=="10" && $("#xxdm").val()=="34234"){
		$("#quickXk").html("<button type='button' class='btn btn-primary btn-sm btn-quick' onclick='showXfyq()'>"+$.i18n.get("msg_xfyq")+"</button>");//通识学分要求
	}
	if($("#xsckxkgzkg").val()=="1"){
		$("#btn_xkgz").remove();
		$("#quickXk").append("<button id='btn_xkgz' type='button' class='btn btn-primary btn-sm btn-quick' onclick='showXkgz()'>查看选课规则</button>");//选课规则
	}
	
	if($("#zzxkxfmcjckg").val()=="1"){
		$("#btn_xfmcjc").remove();
		$("#quickXk").append("<button id='btn_xfmcjc' type='button' class='btn btn-primary btn-sm btn-quick' onclick='checkXfmc()'>选课情况确认</button>");//选课学分确认
	}
	if($("#xsckgrkbkg").val()=="1"){
		$("#btn_grkb").remove();
		$("#quickXk").append("<button id='btn_grkb' type='button' class='btn btn-primary btn-sm btn-quick' onclick='showGrkb()'>查看个人课表</button>");//个人课表
	}
	if($("#firstKklxdm").val()=="xyjsk"){
		$('#searchBox').trigger('searchResult');
	}
	
	if($("#txbsfrl").val()=="1"){
		if(parseInt($("#jsfrlsj").val())<=0){//如果没设延迟锁定时间或已过延迟锁定时间，加载页面时就将此值改为1
			$("#txbsfrl_1").val("1");
		}else{//否则，创建一个定时任务，到时候后，将此值改为1
			setTimeout("$('#txbsfrl_1').val('1')",parseInt($("#jsfrlsj").val())*1000);
		}
	}else{
		$("#txbsfrl_1").val("0");
	}
});