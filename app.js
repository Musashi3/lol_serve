//app.js
//1:加载模块
const express = require("express");
const pool = require("./pool");
const cors = require("cors");
const bodyParser = require("body-parser");
const session=require("express-session");
//2:创建服务器端对象
var app = express();
//3:监听 3000
app.listen(3000);
//4:指定静态目录  public 
app.use(express.static("public"));
//设置允许跨域的url
app.use(cors({
    origin:["http://127.0.0.1:8080","http://localhost:8080"],
    credentials:true
}));
var jsonParser=bodyParser.json();
app.use(bodyParser.urlencoded({
    extended:false
}))
app.use(session({
    secret:"128位随机字符",
    resave:false,
    saveUninitialized:true,
    cookie:{
        maxAge:1000*60*60*8
    }
}));
//登录
app.post("/login",(req,res)=>{
    var uname=req.body.uname;
    var upwd=req.body.upwd;
    var sql="SELECT id FROM lol_user WHERE uname=? AND upwd=md5(?)"
    pool.query(sql,[uname,upwd],(err,result)=>{
        if(err)throw err;
        if(result.length>0){
            var id=result[0].id;
            req.session.uid=id;
            res.send({data:1,msg:"登录成功"})
        }else{
            res.send({data:-1,msg:"用户名或密码错误"})
        }
    })
})
app.get("/login",(req,res)=>{
    if(req.session.uid){
        res.send({code:-1});
        return;
    }
})
//功能一:home 组件轮播图片

app.get("/banner",(req,res)=>{
   //1:将轮播图中所需图片 复制public/img
   //2:查询
   var sql="SELECT img_url FROM lol_banner"
   pool.query(sql,[],(err,result)=>{
       if(err)throw err
       res.send(result); 
   })
});
//获取推荐商品列表
app.get("/show",(req,res)=>{
    var sql="SELECT id,img_url,title,price,classify,pid FROM lol_show"
    pool.query(sql,[],(err,result)=>{
        if(err)throw err;
        res.send(result);
    })
})
//获取手办商品列表
app.get("/clay",(req,res)=>{
    var pno=req.query.pno;
    if(!pno) pno=1;
    var pageSize=req.query.pageSize;
    if(!pageSize) pageSize=4;
    var setoff=(pno-1)*pageSize;
    var ps=parseInt(pageSize)
    var sql="SELECT title,img_url,price,id FROM lol_clay LIMIT ?,?"
    pool.query(sql,[setoff,ps],(err,result)=>{
        if(err) throw err;
        res.send(result);
    })
})
//获取衣服商品列表
app.get("/clothes",(req,res)=>{
    var pno=req.query.pno;
    if(!pno) pno=1;
    var pageSize=req.query.pageSize;
    if(!pageSize) pageSize=4;
    var setoff=(pno-1)*pageSize;
    var ps=parseInt(pageSize);
    var sql="SELECT title,img_url,price,id FROM lol_clothes LIMIT ?,?"
    pool.query(sql,[setoff,ps],(err,result)=>{
        if(err) throw err;
        res.send(result);
    })
})
//获取公仔商品列表
app.get("/plush",(req,res)=>{
    var pno=req.query.pno;
    if(!pno) pno=1;
    var pageSize=req.query.pageSize;
    if(!pageSize) pageSize=4;
    var setoff=(pno-1)*pageSize;
    var ps=parseInt(pageSize);
    var sql="SELECT title,img_url,price,id FROM lol_plush LIMIT ?,?"
    pool.query(sql,[setoff,ps],(err,result)=>{
        if(err) throw err;
        res.send(result);
    }) 
})
//获得商品详情
app.get("/product",(req,res)=>{
    var classify=req.query.classify;
    var id=req.query.id;
    var sql="";
     id=parseInt(id);
    if(classify=="clay")
      sql="SELECT title,img_url,price FROM lol_clay WHERE id=?"
    else if(classify=="clothes")
      sql="SELECT title,img_url,price FROM lol_clothes WHERE id=?"
    else
      sql="SELECT title,img_url,price FROM lol_plush WHERE id=?"
    pool.query(sql,[id],(err,result)=>{
        if(err)throw err;
        res.send(result)
    })
});
//购物车列表
app.get("/buyCar",(req,res)=>{
    if(!req.session.uid){
        res.send({code:-1,msg:"请登录"});
        return;
    }
    var sql="SELECT id,img_url,price,title,count FROM lol_buycar WHERE uid=?"
    pool.query(sql,[req.session.uid],(err,result)=>{
        if(err)throw err;
        res.send(result)
    })
})
//注册
app.post("/register",(req,res)=>{
    var uname=req.body.uname;
    var upwd=req.body.upwd;
    var email=req.body.email;
    var phone=req.body.phone;
    var sql="INSERT INTO lol_user VALUES(null,?,md5(?),?,?)";
    pool.query(sql,[uname,upwd,email,phone],(err,result)=>{
        if(err)throw err;
        if(result.affectedRows>0){
            res.send({data:1,msg:"注册成功"})
        }else{
            res.send({data:-1,msg:"请检查用户名或密码是否正确"})
        }
    })
})
//添加商品到购物车
app.get("/addcart",(req,res)=>{
    var title=req.query.title;
    var price=req.query.price;
    var count=req.query.count;
    var img_url=req.query.img_url;
    var uid=req.session.uid;
    if(!uid){
        res.send({code:-1,msg:"请登录"})
        return;
    }
    var sql="SELECT id FROM lol_buycar WHERE uid=? AND title=?";
    pool.query(sql,[uid,title],(err,result)=>{
        if(err)throw err;
        if(result.length==0){
            var sql=`INSERT INTO lol_buycar VALUES(null,${uid},"${title}","${img_url}",${price},${count})`
            console.log(sql)
        }else{
            var sql=`UPDATE lol_buycar SET count=count+1 WHERE uid=${uid} AND title="${title}"`
        }
        pool.query(sql,(err,result)=>{
            if(err)throw err;
            if(result.affectedRows>0){
                res.send({code:1,msg:"添加成功"})
            }else{
                res.send({code:-1,msg:"添加失败"})
            }
        })
    })

})
//获取用户详情
app.get("/user",(req,res)=>{
    if(!req.session.uid){
        res.send({data:-1,msg:"请登录"});
        return;
    }
    var uid=req.session.uid;
    var sql="SELECT uname,upwd,email,phone FROM lol_user WHERE id=?";
    pool.query(sql,[uid],(err,result)=>{
        if(err) throw err;
        res.send(result);
    })
})
//退出登录
app.get("/logout",(req,res)=>{
    req.session.uid="";
    res.send({code:1,msg:"退出成功"})
})
//删除购物车商品
app.get("/delete",(req,res)=>{
    var id=req.query.id;
    sql="DELETE FROM lol_buycar WHERE id=?"
    pool.query(sql,[id],(err,result)=>{
        if(err)throw err;
        if(result.affectedRows>0){
            res.send({code:1,msg:"删除成功"});
        }else{
            res.send({cod:-1,msg:"删除失败"});
        }
    })
})
//判断是否登录
app.get("/  isLogin",(req,res)=>{
    var uid=req.session.uid;
    if(!uid){
        res.send({code:-1});
        return;
    }
    var sql="select uname from lol_user where id=?"
    pool.query(sql,[uid],(err,result)=>{
        if(err) throw err;
        res.send({code:1,data:result})
    })
})
//个人信息表
app.post("/userList",(req,res)=>{
    var uid=req.session.uid;
    var qq=req.body.qq;
    var reLoginId=req.body.reLoginId;
    var birthday=req.body.birthday;
    var phone=req.body.phone;
    var email=req.body.email;
    var sql="INSERT INTO lol_userList VALUES(?,?,?,?,?,?)"
})
//服务器项目目录
//vue_server_00
//   public
//   pool.js
//   db.sql
//   app.js 
