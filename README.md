# WEGA
Web Graphics course.

### Step 1: Set Up Node.js and npm

Make sure you have Node.js and npm installed. You can download them from [nodejs.org](https://nodejs.org/en). The npm comes bundled with Node.js.

### Step 2: Initialize Your Project

Open your terminal or command prompt, navigate to the root directory of your project, and run the following command:
```	
npm init -y
```
This will create a `package.json` file with default values.

### Step 3: Install Dependencies

Now, you should install any dependencies you have as npm packages. For example, if you’re using `three.js`, `dat.gui`, and orbit controls, you could install them like this:
```	
npm install three dat.gui
```

### Step 4: Use a Bundler (Optional but Recommended)

To bundle your modules together, you may want to use a module bundler like Webpack, Parcel, or Rollup. For example, if you choose Parcel, which requires zero configuration for simple projects, install it globally:
```
npm install -g parcel-bundler
```
Then you can build your project and run a development server with:
```
parcel src/index.html
```
Note, this will automatically run the server (see Step 5).

### Step 5: Run Your Project
Finally, run your project using the npm start script:
```	
npm start
```
Your site should now be running on a local server, typically found at `http://localhost:1234` unless you configure it otherwise.
