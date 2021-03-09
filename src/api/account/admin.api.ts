import { locationRepository } from "@/entities/account";
import { Api } from "@/helpers/gateway";
import axios from "axios";

const handleCrawlLocation = async () => {
  try {
    console.log("Start crawler provinces");
    await locationRepository.delete({});
    const { data: dataProvinces } = await axios.get(
      "https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/province",
      {
        headers: {
          Token: process.env.GHN_TOKEN,
        },
      }
    );
    for (const province of dataProvinces.data || []) {
      console.log("Start crawl district for ", province.ProvinceName);

      const r = await locationRepository.create({
        data: {
          code: province.Code,
          name: province.ProvinceName,
          type: "province",
        },
      });

      const { data: dataDistrict } = await axios.post(
        "https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/district",
        {
          province_id: province.ProvinceID,
        },
        {
          headers: {
            Token: process.env.GHN_TOKEN,
          },
        }
      );

      for (const district of dataDistrict.data || []) {
        console.log("Start crawl ward for ", district.DistrictName);
        const d = await locationRepository.create({
          data: {
            code: district.Code,
            name: district.DistrictName,
            provinceCode: province.Code,
            type: "district",
          },
        });

        const { data: dataWard } = await axios.post(
          "https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/ward?district_id",
          {
            district_id: district.DistrictID,
          },
          {
            headers: {
              Token: process.env.GHN_TOKEN,
            },
          }
        );
        dataWard.data &&
          (await locationRepository.createMany({
            data: dataWard.data.map((ward: any) => ({
              name: ward.WardName,
              code: ward.WardCode,
              provinceCode: province.Code,
              districtCode: district.Code,
              type: "ward",
            })),
          }));
      }
    }
    console.log("crawl location success");
    return true;
  } catch (error) {
    console.log("crawl location error", error);
    return false;
  }
};

export default Api({
  path: "/admin",
  routes: {
    "POST /crawl-location": (req, res, next) => {
      handleCrawlLocation();
      res.json("Task running!");
    },
  },
});
