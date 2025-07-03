const http = require('http')
const fs = require('fs')
const mysql = require('mysql2')

const conexion = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'base1'
})

conexion.connect(error => {
  if (error) console.log('Error al conectar con MySQL')
})

const mime = {
  html: 'text/html',
  css: 'text/css'
}


const server = http.createServer((req, res) => {
  const url = new URL('http://localhost:8888' + req.url)
  let path = 'public' + url.pathname
  if (path === 'public/') path = 'public/index.html'
  route(req, res, path)
})

server.listen(8888, () => {
  console.log('Servidor web iniciado')
})

function route(req, res, path) {
  switch (path) {
    case 'public/creartabla': return crear(res)
    case 'public/alta': return alta(req, res)
    case 'public/listado': return listado(res)
    case 'public/consultaporcodigo': return consulta(req, res)
    default:
      fs.stat(path, err => {
        if (!err) {
          fs.readFile(path, (err, content) => {
            if (err) {
              res.writeHead(500, { 'Content-Type': 'text/plain' })
              res.end('Error interno')
            } else {
              const ext = path.split('.').pop()
              res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain' })
              res.end(content)
            }
          })
        } else {
          res.writeHead(404, { 'Content-Type': 'text/html' })
          res.end('<h1>Página no encontrada</h1>')
        }
      })
  }
}

function crear(res) {
  conexion.query('DROP TABLE IF EXISTS categorias')
  conexion.query(`CREATE TABLE categorias (
    codigo INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50),
    descripcion TEXT
  )`, err => {
    if (err) return res.end('Error al crear tabla')
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(`<p>Tabla creada</p><a href="index.html">Volver</a>`)
  })
}

function alta(req, res) {
  let info = ''
  req.on('data', chunk => info += chunk)
  req.on('end', () => {
    const form = new URLSearchParams(info)
    const categoria = {
      nombre: form.get('nombre'),
      descripcion: form.get('descripcion')
    }
    conexion.query('INSERT INTO categorias SET ?', categoria, err => {
      if (err) return res.end('Error al insertar categoria')
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(`<p>Categoria registrada</p><a href="index.html">Volver</a>`)
    })
  })
}

function listado(res) {
  conexion.query('SELECT * FROM categorias', (err, rows) => {
    if (err) return res.end('Error al listar')
    res.writeHead(200, { 'Content-Type': 'text/html' })
    let contenido = '<h1>Categorias</h1>'
    rows.forEach(row => {
      contenido += `Código: ${row.codigo}<br>Nombre: ${row.nombre}<br>Descripcion: ${row.descripcion}<hr>`
    })
    contenido += '<a href="index.html">Volver</a>'
    res.end(contenido)
  })
}

function consulta(req, res) {
  let info = ''
  req.on('data', chunk => info += chunk)
  req.on('end', () => {
    const form = new URLSearchParams(info)
    const codigo = form.get('codigo')
    conexion.query('SELECT * FROM categorias WHERE codigo = ?', [codigo], (err, rows) => {
      if (err) return res.end('Error al consultar')
      res.writeHead(200, { 'Content-Type': 'text/html' })
      if (rows.length > 0) {
        const cat = rows[0]
        res.end(`<p>Nombre: ${cat.nombre}</p><p>Descripcion: ${cat.descripcion}</p><a href="index.html">Volver</a>`)
      } else {
        res.end('<p>No existe esa categoria</p><a href="index.html">Volver</a>')
      }
    })
  })
}
