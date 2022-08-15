window.onload = run
let wm, splashfs
function run(){
    setInterval(()=>{document.getElementById("date").innerText=new Date().toLocaleString()},1_000)
    fetch("/fs.json").then((t)=>{
        t.json().then(data=>splashfs=new Splashfs(data))
    })
    wm = new windowManager(document.getElementById("wm"), document.getElementById("terminals"))
    fetch('https://little.tlkoe.xyz/api/infos').then(t=>t.json().then(data=>{
        const doc = document.getElementById('little')

        const img = document.createElement('img')
        const text = document.createElement('p')
        
        img.src = data.author.avatar+"?size:2048"
        img.style.height = "23px"
        img.style.width = "23px"
        text.innerText = data.author.username+"#"+data.author.discriminator

        //doc.appendChild(img)
        //doc.appendChild(text)
    }))
    wm.started = Date.now()
}

class Term{
    constructor(r, parent){

        let term = new Terminal({
            allowTransparency:true,
            theme:{
                background:"#000000a1"
            }

        })

        let fitaddon = new FitAddon.FitAddon()
        term.loadAddon(fitaddon)
        term.open(r)
        fitaddon.fit()
        this.fitaddon = fitaddon
        this.xterm = term
        this.psh = new PSH(this.xterm, parent)
    }
}
class Win{
    constructor(root, id){
        this.id = id
        const window = document.createElement("div")
        window.classList.add("terminal")
        window.classList.add("blur")
        window.id = id
        window.style.width="0px"
        let length = root.windows.length
        const animation = length === 0? "terminal":length==1?"rterminal":length==2?"brterminal":"blterminal"
        window.style.animation = `${animation} 0.9s ease`

        window.style.width = "100%"
        window.style.height = "100%"


        window.onclick = this.onclick.bind(this)

        window.addEventListener('animationend', ()=>{
            root.updatewm()
        })
        root.root.appendChild(window)
        this.term = new Term(window, root)
        
        this.parent = root
        this.root = window

        this.chooseDimensions()
    }
    takeFocus(){
        this.parent.windows.focus = this.root
        this.parent.updatewm(this.id.slice(-1))
    }
    onclick(){
        this.takeFocus()
    }
    chooseDimensions(){
        //simplier, when 0 wins
        const length = this.parent.windows.length

        switch(length % 4){
            case 0:
                
            break;
            case 1:
                this.root.style.gridColumn=2
                this.root.style.gridRow=1
            break;
            case 2:
                this.root.style.gridColumn=2
                this.root.style.gridRow=2
                this.parent.windows[0].root.style.gridRow = "1 / 3"
            break;
            case 3:
                this.root.style.gridColumn=1
                this.root.style.gridRow=2
                this.parent.windows[0].root.style.gridRow = 1
            break;
        }
    }
}
class windowManager{
    constructor(holder, display){
        this.holder = holder
        this.root = display
        this.windows = []
        this.windows.wm = []

        const add = document.createElement("button")
        add.innerText="+"
        add.style.float ="left"
        add.style.padding = "0px 7px"
        add.style.height = "100%"
        add.style["border-top-left-radius"]= "5px"
        add.style["border-bottom-left-radius"]= "5px"

        this.addbutton = add

        add.onclick = ()=>{
            this.newWindow({

            })
        }
        holder.appendChild(add)

        const wm = document.createElement("div")
        wm.style.height = "100%"
        wm.style.width = "calc(100% - 26px)"
        wm.style.float ="left"
        this.wm = wm

        holder.appendChild(wm)
        this.updatewm()
    }
    newWindow(options){
        if(this.windows.length === 4)return
        const window = new Win(this, "term"+(this.windows.length+1))
        this.windows.push(window)
        this.windows.focus = window.root
        window.term.xterm.focus()
        this.updatewm(this.windows.length)
    }
    updatewm(id){
        this.windows.forEach(t=>t.term.fitaddon.fit())
        const wcount = this.windows.length
        const wmcount = this.windows.wm.length
        if(wcount>wmcount){ //added a window
            const w = document.createElement("button")
            w.style.float ="left"
            w.style.padding = "0px 7px"
            w.style.height = "100%"
            w.innerText = id
            w.onclick=()=>{this.windows.focus = document.getElementById("term"+id); this.updatewm(id)}
            this.windows.wm.push(w)
            this.wm.appendChild(w)

        } else if(wcount<wmcount){ //deleted a window
            this.wm.removeChild(this.wm.children[id-1])
            this.windows.wm.splice
        } else { //wtf?

        }
        if(this.windows.focus){
            const idd = this.windows.focus.id.slice(-1)
            const elmt = this.wm.children[idd-1]
            if(!elmt)""
            else {
                    this.windows[idd-1].root.classList.add("focused")
                    elmt.style.borderBottom="solid white 2px"
                    this.windows.forEach((e)=>{
                        
                        if(e.id.slice(-1) != elmt.innerText){
                            this.wm.children[e.id.slice(-1)-1].style.borderBottom="solid white 0px"
                            this.windows[e.id.slice(-1)-1].root.classList.remove("focused")
                        }
                    })
            }
        }
    }
}
class PSH{
    constructor(xterm, parent){
        this.history = new History(this)
        this.parent = parent
        this.xterm = xterm
        xterm.prompt = ()=>{
            let exitcode=""
            if(this.vars["?"]>0){
                exitcode = ` \u001b[31;1m${this.vars["?"]}\u001b[0m` 
            }
            this.promptText = `\u001b[92m${this.vars.USER}\u001b[0m@${this.vars.HOSTNAME} \u001b[92m${this.vars.PWD}\u001b[0m${exitcode}$ `
            this.write(this.promptText)
        }
        
        let self = this
        function p(){
                self.write("Welcome on my portfolio, you can use `help` at any moment", "\r\n")
                xterm.prompt()
                xterm.onKey(self.onKey.bind(self))
                parent.root.removeEventListener("animationend", p)
        }
        parent.root.addEventListener('animationend', p)
    }
    buffer = {
        line:"",
        cursor:0,
        before:""
    }
    vars = {
        USER:"little",
        HOSTNAME:"pandora",
        PWD:"~",
        PATH:"/bin",
        "?":0,
        SHELL:"psh",
        HOME:"/home/little"
    }
    clean(){
        this.buffer={line:"", cursor:0, before:""}
    }
    onData(key, data){console.log(key, data)}
    onKey({k, domEvent:ev}){
        if(this.process){
            if(ev.key === "c" && ev.ctrlKey){
                this.process.abort()
            }
            return
        }
        const printable = !ev.altKey && !ev.altGraphKey && !ev.ctrlKey && !ev.metaKey && ev.key.match(/^.$/)
        let { key } = ev

        console.log(key)
        if(printable){
            this.buffer.line = this.buffer.line.slice(0, this.buffer.cursor)+key+this.buffer.line.slice(this.buffer.cursor)
            this.buffer.cursor++
        } else if(key.startsWith("Arrow")){
            if(key == "ArrowLeft"){
                if(this.buffer.cursor < 1){}
                else this.buffer.cursor--
            } else if(key == "ArrowRight"){
                if(this.buffer.cursor >= this.buffer.line.length){}
                else this.buffer.cursor++
            } else if(key == "ArrowUp"){
                this.buffer.line = this.history.next()
                this.buffer.cursor = this.buffer.line.length
            } else if(key == "ArrowDown"){
                this.buffer.line = this.history.before()
                this.buffer.cursor = this.buffer.line.length
            } else console.log("non printable arrow key? "+key)
        } else if(key == "Home"){
            this.buffer.cursor = 0
        } else if(key == "End"){
            this.buffer.cursor = this.buffer.line.length
        } else if(key == "Backspace"){
            if(this.buffer.cursor <= 0){}
            else {
                this.buffer.line = this.buffer.line.slice(0,this.buffer.cursor-1)+this.buffer.line.slice(this.buffer.cursor)
                this.buffer.cursor-=1
            }
        } else if(key == "Delete"){
            if(this.buffer.cursor>=this.buffer.line.length){}
            else this.buffer.line = this.buffer.line.slice(0,this.buffer.cursor)+this.buffer.line.slice(this.buffer.cursor+1)
        } else if(key == "Enter"){
            this.history.unshift(this.buffer.line)
            this.history.index=0
            this.update(true)
            this.buffer.line.length<1?this.xterm.prompt():this.execute()
            this.clean()
            return
        } else if(ev.ctrlKey){
            if(key==="l"){this.xterm.clear()}
            if(key==="c"){this.update(true); this.clean(); this.write("/n/r"); this.xterm.prompt()}
        }
        this.update()
    }
    onScroll(){}
    onCursorMove(){}
    onResize(){}
    onLineFeed(){}
    write(...args){
        this.xterm.write(args.join(""))
    }
    writeln(...args){
        this.xterm.writeln(args.join(""))
    }
    update(newline){
        const tow = [this.esc('[0G','[0J'), this.promptText, this.buffer.line, this.esc(`[${this.escape(this.promptText).length+1+this.buffer.cursor}G`)]
        if(newline)return this.writeln(...tow)
        return this.write(...tow)
    }
    esc(...seq){
        return seq.map(t=>"\u001b"+t).join("")
    }
    escape(text){
        return text.replace(new RegExp("\u001b[^a-zA-Z]+.", "g"), "")
    }
    execute(){
        const cmd = this.buffer.line.split(" ")[0]
        if(cmd in this.builtins){
            if( typeof this.builtins[cmd].exec == "function"){
                this.process = new Process(this, this.builtins[cmd])
            } else {
                this.write("cannot execute ", cmd, " : invalid exec() format", "\n\r")
                this.xterm.prompt()
            }
        } else if(cmd in this.commands || this.vars.PATH.split(":").some(t=>splashfs.existFile(this.resolvePath(t+"/"+cmd)))){ //fs
            if(cmd in this.commands){
                this.process = new Process(this, this.commands[cmd])
            } else {
                const cmds = this.vars.PATH.split(":").map(t=>splashfs.readFile(this.resolvePath(t+"/"+cmd))).filter(t=>"success" in t)[0]
                const command = eval(cmds.success) //err that's bad but i have no other choices..

                if( typeof command.exec == "function"){
                    this.commands[cmd] = command

                    this.process = new Process(this, command)
                } else {
                    console.log(command, cmds.success)
                    this.write("cannot execute ", cmd, " : invalid exec() format", "\n\r")
                    this.xterm.prompt()
                }
            }
        } else {
            this.write("command not found: ",cmd, "\n\r")
            this.xterm.prompt()
        }
        
    }
    resolvePath(path, symbol){
        const {PWD, HOME} = this.vars
        path = this.resolveVars(path)
        let _path = ""
        let pwd = PWD.replace(/~/g, HOME)

        path.split("/").forEach((e, i)=>{
            if(i==0 && (e!=="")){
                if(e=="~")_path=HOME
                else _path= pwd
            }
            if(e == ".."){
                _path = _path.split("/").slice(0,-1).join("/")
            } else if(e=="."||e=="~"){}
            else if(e.length>0)_path+="/"+e
        })
        if(symbol)return _path.length < 1? "/" : ("/"+_path.split("/").filter(t=>t.length>0).join("/")).replace(HOME, "~")
        return _path.length < 1? "/" : "/"+_path.split("/").filter(t=>t.length>0).join("/")
    }
    resolveVars(text){
        return text.split(" ").map(arg=>arg.replace(/\$[^ ]+/g, (matched)=>{
            const m = Object.keys(this.vars).map(t=>[matched.slice(1).startsWith(t), t]).filter(t=>Boolean(t[0]))[0]
            return matched.slice(1).replace(m[1], this.vars[m[1]])
        })).join(" ")
    }
    builtins = {
        "echo":{
            description:"echo specified arguments",
            exec:function (data){
                let {argv, psh, exit, signal, write} = data

                argv = psh.resolveVars(argv.join(" "))
                write(argv, "\n\r")
                exit(0)
            }
        },
        "cd":{
            description:"change directory",
            exec:(data)=>{
                let {argv, psh, exit, signal, write, fs} = data

                let path = argv[0]
                if(!path)path="~"
                const dir = fs.existDir(psh.resolvePath(path))
                if(!dir){
                    write("Error: no such directory: ",path, "\n\r")
                    exit(1)
                }
                psh.vars.PWD = psh.resolvePath(path, true)
                exit(0)
            }
        },
        "clear":{
            description:"clear the screen",
            exec:(data)=>{
                data.write(data.psh.esc("[H", "[2J"))
                data.psh.xterm.clear()
            }
        },
        "pwd":{
            description:"display the directory you're in",
            exec:(data)=>{
                data.write(data.psh.resolvePath(data.psh.vars.PWD),"\r\n")
            }
        },
        "read":{},
        "type":{},
        "which":{},
        "time":{},
        "test":{
            description:"test purpose only",
            exec:async(data)=>{
                let {argv, psh, exit, signal} = data

                const action = argv[0]

                if(action == "exit")exit(argv[1])
                if(action == "throw")throw new Error("blep")
                if(action == "wait"){await new Promise(r=>setTimeout(r, 10000))}
                if(action == "file"){
                    console.log(splashfs.readFile(this.resolvePath(argv[1])))
                }
                if(action == "dir"){
                    console.log(splashfs.readDir(this.resolvePath(argv[1])))
                }
            }
        }
    }
    commands={}
}
class Process{
    constructor(parent, cmd){
        this.parent = parent
        const ev = new Event()
        this.signal = ev
        this.process = new Promise((resolve,reject)=>{
            let excited = false, func
            try{
                func = cmd.exec({fs:splashfs,write:this.parent.write.bind(this.parent),psh:this.parent, argv:this.parent.buffer.line.split(" ").slice(1), exit:(n)=>{this.parent.vars["?"] = Number(n); if(isNaN(this.parent.vars["?"])){this.parent.vars["?"]=1}; excited=true; throw new Error(n)}, signal:ev})
            } catch(err){
                if(excited)resolve()
                else reject(err)
            }
            if(typeof func?.then == "function"){
                func.then(resolve, reject)
            } else {
                resolve()
            }
        }).then(()=>{}, (err)=>{this.parent.write("an error occured: ",err.message, "\n\r"); this.parent.vars["?"]=1; console.log(err)}).finally(()=>{this.parent.process=undefined; this.parent.xterm.prompt()})

    }
    abort(){
        this.signal.emit("sigint")
    }
}


class History extends Array{
    constructor(parent){
        super()
        this.parent = parent
    }
    size=100
    index=0
    unshift(item){
        if(item === this[0] || item=="")return
        if(this.length >=this.size) this.pop()

        this.index = 0
        super.unshift(item)
    }
    clean(){
        for(let i = this.length; i > 0; i--){
            this.pop()
        }
    }
    next(){
        if(!(this.index in this))return this.parent.buffer.line
        if(this.index == 0)this.parent.buffer.before = this.parent.buffer.line
        this.index++
        return this[this.index-1]
    }
    before(){
        if(!(this.index-1 in this))return this.parent.buffer.line
        this.index--
        if(!(this.index-1 in this))return this.parent.buffer.before
        return this[this.index-1]
    }
}

class Event{
    constructor(){
        Object.defineProperty(this, '_events', {
            value: {},
            writable: false,
            configurable: false
        });
        this.wborder = document.getElementById('wborder');
    }
    on(name, callback){
        if(typeof callback !== 'function'){
            throw new Error('Callback must be a function, got ' + typeof callback);
        }
        if(!this._events[name]){
            this._events[name] = [];
        }
        this._events[name].push(callback);
        return this
    }
    once(name, callback){
        if(typeof callback !== 'function'){
            throw new Error('Callback must be a function, got ' + typeof callback);
        }
        if(!this._events[name]){
            this._events[name] = [];
        }
        const self = this;
        const cb = (...data) => {
            callback.bind(self)(...data);
            this.off(name, cb);
        }
        this._events[name].push(cb);
        return this
    }
    off(name, fct){
        if(!this._events[name]){
            return this
        }
        if(!isNaN(fct)){
            this._events[name].splice(fct, 1);
            return this
        }
        if(typeof fct !== 'function'){
            delete this._events[name];
            return this
        }
        this._events[name] = this._events[name].filter(callback => callback !== fct);
        return this
    }
    emit(name, ...data){
        if(this._events[name]?.length < 1 || this._events[name] === undefined){
            return false
        }
        this._events[name].forEach(callback => callback.bind(this)(...data));
        return true
    }
}

class Splashfs{
    constructor(json){
        this.fs = json
    }
    errors = ["no such file or directory", "no such file", "no such directory"]
    resolveError(n){
        return this.errors[n-1]
    }
    readFile(path){
        let fs = this.fs
        path.split("/").filter(Boolean).forEach((e, i, a)=>{
            let l = a.length

            if(fs?.[e]){
                fs = fs[e]
            } else fs = undefined
        })
        if(!fs)return {error:{code:1,message:this.resolveError(1)}}
        else if("content" in fs){return {success:fs.content}}
        else return {error:{code:2,message:this.resolveError(2)}}
    }
    readDir(path){
        let fs = this.fs
        path.split("/").filter(Boolean).forEach((e, i, a)=>{
            let l = a.length

            if(fs?.[e]){
                fs = fs[e]
            } else fs = undefined
        })
        if(!fs)return {error:{code:1,message:this.resolveError(1)}}
        else if(!("content" in fs)){return {success:Object.keys(fs)}}
        else return {error:{code:2,message:this.resolveError(2)}}
    }
    existFile(path){
        let fs = this.fs
        path.split("/").filter(Boolean).forEach((e, i, a)=>{
            let l = a.length

            if(fs?.[e]){
                fs = fs[e]
            } else fs = undefined
        })
        if(!fs)return false
        else if("content" in fs)return true
        else return false
    }
    existDir(path){
        let fs = this.fs
        path.split("/").filter(Boolean).forEach((e, i, a)=>{
            let l = a.length

            if(fs?.[e]){
                fs = fs[e]
            } else fs = undefined
        })
        if(!fs)return false
        else if("content" in fs)return false
        else return true
    }
    stats(path){
        let fs = this.fs
        path.split("/").filter(Boolean).forEach((e, i, a)=>{
            let l = a.length

            if(fs?.[e]){
                fs = fs[e]
            } else fs = undefined
        })
        if(!fs)return {error:{code:1,message:this.resolveError(1)}}
        else if("content" in fs)return {file:true, dir:false}
        else return  {file:false, dir:true}
    }
    writeFile(){

    }
    mkDir(){

    }
    mkFile(){

    }
    rmDir(){

    }
    rmFile(){

    }
}