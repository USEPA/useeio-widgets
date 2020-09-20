# Adding New Technologies to US Input-Output Model

This process is being used to add an 
<a href="../bioeconomy/">Advanced Biofuels technology sector</a> to the US EPA IO model.  


From [four approaches to new technology modeling using USEEIO model](https://github.com/GeorgiaData/smartdata/blob/master/interns/NewTechnologyModelingOptions.md), the selected approach below corresponds to 1b and the specific methodological steps, to modify USEEIO to include an additional new bioeconomy sector, can be found in [View Steps](add/). 

When thinking about new technologies, we can refer to 2 types:
1. Technologies that already exist in the US economy (its products are being produced on a commercial basis and are being traded in markets) but, because of the aggregation used in USEEIO, are contained in one of the existing sectors. For example: Electricity generation using biomass exists in current economy, in USEEIO model is contained in Sector 221100- "Electric power generation, transmission, and distribution". In fact, there is a 6-digit NAICS code (contained in 221100 BEA code) more similar to this technology 221117- "Biomass electric power generation".
2. Technologies that do not exist in the US economy because they are still in development, commercially ready, with demonstration facilities or others, but that are not being traded in US markets (in 2012 where the USEEIO BEA data comes from). For this reason, these technologies are not contained in any BEA sector and therefore in any sector in USEEIO. For example: Production of fuels and chemicals using ligno-cellulosic materials. 

It is important to note that most of the Bioeconomy technologies considered belong to type 2. Therefore the methology and steps designed and currently implemented in useeior (through the createBioeconomyModel() function) are not a strict disaggregation of an existing USEEIO sector. 

## Steps
Considering the description above, if you want to add a new technology to the USEEIO model:

1. Determine if the technology you want to add is type 1 or type 2.
2. If is Type 2,
	1. Read [View Steps](add/).
	2. Gather the following data: 
		- Which is the new sector to add (name and code).
		- Which is the similar sector (BEA code).
		- % of output of the original sector that new sector will produce.
		- The amount spent in each of the n commodities to produce "Total Industry Output" in the new sector. (Including Z_(n+1,n+1))
		- Data of all  environmental flows associated with the new sector. (Environmental flows per dollar of output of the new sector).
	3. Fork the repo.
	4. Use createBioeconomyModel() function following USEEIO20-GHG-Bio.R example to add one additional sector using the gathered data.
	
3. If is Type 1, you'll do a strict disaggregation of an existing USEEIO sector (not yet implemented). For this:
   1. Check if your new category already exists in the [Green NAICS list](green/2010/industry_by_naics.csv).
   2. Fork the repo.
   3. Follow user steps (pending).

<!--
	blob/master/Versioning/VersioningSchema.md
-->
<a name="R"></a>
<h2>USEEIOR - USEEIO Model Building in R-Language</h2>

Pulls U.S. Bureau of Economic Analysis (BEA) data and environmental data from satellite tables to develop an Environmentally Extendended Input-Output model.  

<b>Steps to run an existing version of USEEIO using useeior to get the impact results</b>
1. Install R and RStudio.
2. Install devtools package. Run the following, or in RStudio go to "Tools > Install Packages > devtools"  
	
		install.packages(‘devtools’)
		library(devtools)
	
3. [Install useeior package](https://github.com/USEPA/useeior/wiki/Install). 
In RStudio, open the file useeior/examples/USEEIO20-GHG.R which contains: 

		#Start with clean
		remove.packages("useeior")
		#install
		devtools::install_github("USEPA/useeior")

		library(useeior)
		useeior::seeAvailableModels()
		model <- useeior::buildEEIOModel('USEEIOv2.0-GHG')
		result <- useeior::calculateEEIOModel(model, perspective='DIRECT')
		useeior::writeModelComponents(model)
	
4. Select useeior::seeAvailableModels() and click Run to see available models according to [USEEIO Model Versioning Scheme](https://github.com/USEPA/USEEIO/blob/master/VersioningScheme.md)
5. Choose the model of interest and replace 'USEEIOv2.0-GHG' with the name of the choosen model. Don't forget the ' '.
6. Select model <- useeior::buildEEIOModel('USEEIOv2.0-GHG') and click Run.
7. Select and Run the last two lines of code in the example.


To view expandable hierarchies enter the command:  

	View(model) 

To view a section of the hierarchy:  

	model$  
	model$[choose]$  
8. To see model results in R write View(result$LCIA_d) on Console and press Enter or to see the .csv exported file, search in your computer for a file called USEEIOv2.0-GHG_LCIA.csv.

<!-- 2. Clone or create a [fork of the USEEIOR Repo](https://github.com/usepa/useeior/), or work in the [modeleearth fork](https://github.com/modelearth/useeior/)  -->

<h2>Other notes about useeior</h2>

- [Learn about Matrix Algebra](../about/matrix) - includes EEIO matrix names and equations  

- Learn about additional matrixes: [US EPA's USEEIO API](https://github.com/USEPA/USEEIO_API)  

- A visual representation of the [Data Formats: Matrix File Rows and Columns](https://github.com/USEPA/USEEIO_API/blob/master/doc/data_format.md)  


	To add to page above:  
	[Input-Output Model Builder (iomb)](https://github.com/USEPA/IO-Model-Builder)


- Configuration (meta data) of model. Use in buildEEIOModel in code above:  
useeior/inst/extdata/USEEIOv2.0.12s-GHG.yml  

- CSV files are in the same folder.  
These will be moved to FlowSA later.  

- .RDA - Faster for R than CSV loading  

- To find a function:  
Code > Go to File/Function

- BEA List: LoadIOTables  

- "intermediate" and "final consumer" margins tables for conversions

- [Here is a previous release of the USEEIO model](https://github.com/USEPA/USEEIO/releases) to download a zip file with the complete list of LCIA indicators.  
The latest USEEIOR version only has Greeen House Gas (GHG) indicators.  


